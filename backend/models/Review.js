import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  rigger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  helpful: {
    type: Number,
    default: 0
  },
  reported: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
reviewSchema.index({ rigger: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, rigger: 1 }, { unique: true }); // One review per reviewer per rigger

export default mongoose.model('Review', reviewSchema);

