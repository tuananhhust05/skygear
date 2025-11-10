import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rigger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'stablecoin', 'bank_transfer']
    },
    amount: Number,
    currency: String,
    transactionId: String,
    bridgePaymentId: String,
    stripePaymentIntentId: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    paidAt: Date
  },
  delivery: {
    method: {
      type: String,
      enum: ['pickup', 'shipping']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    trackingNumber: String,
    shippingLabel: String,
    shippedAt: Date,
    deliveredAt: Date
  },
  pricing: {
    listingPrice: Number,
    shippingCost: Number,
    totalAmount: Number,
    fees: {
      riggerFee: Number,
      platformFee: Number,
      sellerAmount: Number
    }
  },
  payouts: {
    seller: {
      amount: Number,
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed']
      },
      payoutId: String
    },
    rigger: {
      amount: Number,
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed']
      },
      payoutId: String
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);

