import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
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
    enum: ['pending', 'inspection', 'listed', 'sold', 'cancelled'],
    default: 'pending'
  },
  rigDetails: {
    manufacturer: String,
    model: String,
    size: String,
    serialNumber: String,
    jumpCount: Number,
    year: Number
  },
  canopy: {
    manufacturer: String,
    model: String,
    size: String,
    cellCount: Number
  },
  reserve: {
    manufacturer: String,
    model: String,
    size: String,
    lastRepackDate: Date,
    nextRepackDue: Date
  },
  aad: {
    aadType: String, // Renamed from 'type' to avoid Mongoose reserved keyword conflict
    model: String,
    lastServiceDate: Date,
    nextServiceDue: Date,
    status: {
      type: String,
      enum: ['active', 'needs_service', 'expired']
    }
  },
  inspectionReport: {
    riggerNotes: String,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'needs_repair']
    },
    recommendedServices: [{
      service: String,
      cost: Number,
      description: String
    }],
    inspectionDate: Date,
    inspectorName: String
  },
  images: {
    serialNumber: String,
    reservePackingSheet: String,
    fullRigView: [String], // Changed to array to support multiple images
    additional: [String]
  },
  pricing: {
    desiredPrice: Number,
    listingPrice: Number,
    fees: {
      riggerFee: Number,
      platformFee: Number,
      totalFees: Number
    }
  },
  delivery: {
    method: {
      type: String,
      enum: ['self_deliver', 'platform_shipping']
    },
    trackingNumber: String,
    shippingLabel: String
  },
  listingInfo: {
    title: String,
    description: String,
    publishedAt: Date,
    views: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('Listing', listingSchema);

