import express from 'express';
import axios from 'axios';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Initialize payment - supports both Stripe (card) and Bridge.xyz (stablecoin)
router.post('/initialize', authenticate, async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    const order = await Order.findById(orderId)
      .populate('seller', 'paymentInfo')
      .populate('rigger', 'paymentInfo');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order already processed' });
    }

    // Handle Stripe payment (Visa/Master Card)
    if (paymentMethod === 'card' || paymentMethod === 'stripe') {
      try {
        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(order.pricing.totalAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            orderId: order._id.toString(),
            buyerId: order.buyer.toString(),
            sellerId: order.seller._id.toString(),
            riggerId: order.rigger._id.toString(),
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        // Update order with payment info
        order.payment = {
          method: 'card',
          amount: order.pricing.totalAmount,
          currency: 'USD',
          stripePaymentIntentId: paymentIntent.id,
          status: 'pending'
        };

        await order.save();

        res.json({
          paymentMethod: 'stripe',
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          order: order
        });
      } catch (error) {
        console.error('Stripe payment error:', error.message);
        res.status(500).json({ 
          message: 'Stripe payment initialization failed',
          error: error.message 
        });
      }
      return;
    }

    // Handle Bridge.xyz payment (stablecoin or bank_transfer)
    if (paymentMethod === 'stablecoin' || paymentMethod === 'bank_transfer') {
      try {
        // Bridge.xyz payment initialization
        const bridgePayload = {
          amount: order.pricing.totalAmount,
          currency: 'USD',
          paymentMethod: paymentMethod === 'stablecoin' ? 'stablecoin' : 'bank_transfer',
          metadata: {
            orderId: order._id.toString(),
            buyerId: order.buyer.toString()
          },
          // Multi-party payout configuration
          payouts: [
            {
              recipient: order.seller.paymentInfo?.bankAccount?.accountNumber || order.seller.paymentInfo?.cryptoWallet,
              amount: order.pricing.fees.sellerAmount,
              currency: 'USD',
              description: 'Seller payout for rig sale'
            },
            {
              recipient: order.rigger.paymentInfo?.bankAccount?.accountNumber || order.rigger.paymentInfo?.cryptoWallet,
              amount: order.pricing.fees.riggerFee,
              currency: 'USD',
              description: 'Rigger fee for listing and inspection'
            }
          ]
        };

        // Call Bridge.xyz API
        const bridgeResponse = await axios.post(
          `${process.env.BRIDGE_API_URL}/v1/payments`,
          bridgePayload,
          {
            headers: {
              'Authorization': `Bearer ${process.env.BRIDGE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Update order with payment info
        order.payment = {
          method: paymentMethod,
          amount: order.pricing.totalAmount,
          currency: 'USD',
          bridgePaymentId: bridgeResponse.data.id,
          transactionId: bridgeResponse.data.transactionId
        };

        order.payouts = {
          seller: {
            amount: order.pricing.fees.sellerAmount,
            status: 'pending',
            payoutId: bridgeResponse.data.payouts?.[0]?.id
          },
          rigger: {
            amount: order.pricing.fees.riggerFee,
            status: 'pending',
            payoutId: bridgeResponse.data.payouts?.[1]?.id
          }
        };

        await order.save();

        res.json({
          paymentMethod: 'bridge',
          paymentId: bridgeResponse.data.id,
          paymentUrl: bridgeResponse.data.paymentUrl,
          order: order
        });
      } catch (error) {
        console.error('Bridge.xyz payment error:', error.response?.data || error.message);
        res.status(500).json({ 
          message: 'Bridge.xyz payment initialization failed',
          error: error.response?.data || error.message 
        });
      }
      return;
    }

    res.status(400).json({ message: 'Invalid payment method' });
  } catch (error) {
    console.error('Payment initialization error:', error.message);
    res.status(500).json({ 
      message: 'Payment initialization failed',
      error: error.message 
    });
  }
});

// Webhook handler for Stripe
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const order = await Order.findOne({ 'payment.stripePaymentIntentId': paymentIntent.id });
      
      if (order) {
        order.status = 'paid';
        order.payment.paidAt = new Date();
        order.payment.transactionId = paymentIntent.id;
        order.payment.status = 'completed';
        
        // Initialize payouts for seller and rigger
        order.payouts = {
          seller: {
            amount: order.pricing.fees.sellerAmount,
            status: 'pending',
          },
          rigger: {
            amount: order.pricing.fees.riggerFee,
            status: 'pending',
          }
        };
        
        // Mark listing as sold
        const Listing = (await import('../models/Listing.js')).default;
        await Listing.findByIdAndUpdate(order.listing, { status: 'sold' });
        
        await order.save();
        console.log(`✅ Order ${order._id} marked as paid via Stripe`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Webhook handler for Bridge.xyz
router.post('/webhook/bridge', async (req, res) => {
  try {
    const { event, data } = req.body;

    if (event === 'payment.completed') {
      const order = await Order.findOne({ 'payment.bridgePaymentId': data.id });
      
      if (order) {
        order.status = 'paid';
        order.payment.paidAt = new Date();
        order.payouts.seller.status = 'processing';
        order.payouts.rigger.status = 'processing';
        
        // Mark listing as sold
        const Listing = (await import('../models/Listing.js')).default;
        await Listing.findByIdAndUpdate(order.listing, { status: 'sold' });
        
        await order.save();
      }
    }

    if (event === 'payout.completed') {
      const order = await Order.findOne({
        $or: [
          { 'payouts.seller.payoutId': data.id },
          { 'payouts.rigger.payoutId': data.id }
        ]
      });

      if (order) {
        if (order.payouts.seller.payoutId === data.id) {
          order.payouts.seller.status = 'completed';
        }
        if (order.payouts.rigger.payoutId === data.id) {
          order.payouts.rigger.status = 'completed';
        }
        await order.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Bridge.xyz webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Get payment status
router.get('/:orderId/status', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      order.buyer.toString() !== req.user._id.toString() &&
      order.seller.toString() !== req.user._id.toString() &&
      order.rigger.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Optionally check with Bridge.xyz for latest status
    if (order.payment.bridgePaymentId) {
      try {
        const bridgeResponse = await axios.get(
          `${process.env.BRIDGE_API_URL}/v1/payments/${order.payment.bridgePaymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.BRIDGE_API_KEY}`
            }
          }
        );

        res.json({
          order,
          bridgeStatus: bridgeResponse.data.status
        });
      } catch (error) {
        res.json({ order });
      }
    } else {
      res.json({ order });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

