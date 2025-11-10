import express from 'express';
import Order from '../models/Order.js';
import Listing from '../models/Listing.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create   order
router.post('/', authenticate, async (req, res) => {
  try {
    const { listingId, delivery } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'listed') {
      return res.status(400).json({ message: 'Listing not available' });
    }

    const order = new Order({
      listing: listingId,
      buyer: req.user._id,
      seller: listing.seller,
      rigger: listing.rigger,
      delivery,
      pricing: {
        listingPrice: listing.pricing.listingPrice,
        shippingCost: delivery.method === 'shipping' ? 50 : 0, // TODO: Calculate from shipping aggregator
        totalAmount: listing.pricing.listingPrice + (delivery.method === 'shipping' ? 50 : 0),
        fees: {
          riggerFee: listing.pricing.fees.riggerFee,
          platformFee: listing.pricing.fees.platformFee,
          sellerAmount: listing.pricing.listingPrice - listing.pricing.fees.riggerFee - listing.pricing.fees.platformFee
        }
      },
      status: 'pending'
    });

    await order.save();
    await order.populate(['listing', 'seller', 'rigger', 'buyer']);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('listing')
      .populate('buyer', 'profile')
      .populate('seller', 'profile')
      .populate('rigger', 'profile riggerInfo');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user has access
    if (
      order.buyer._id.toString() !== req.user._id.toString() &&
      order.seller._id.toString() !== req.user._id.toString() &&
      order.rigger._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's orders
router.get('/user/mine', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { buyer: req.user._id },
        { seller: req.user._id },
        { rigger: req.user._id }
      ]
    })
    .populate('listing')
    .populate('buyer', 'profile')
    .populate('seller', 'profile')
    .populate('rigger', 'profile')
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization checks
    if (status === 'shipped' && order.rigger._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only rigger can mark as shipped' });
    }

    order.status = status;
    if (trackingNumber) {
      order.delivery.trackingNumber = trackingNumber;
      order.delivery.shippedAt = new Date();
    }

    if (status === 'delivered') {
      order.delivery.deliveredAt = new Date();
    }

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

