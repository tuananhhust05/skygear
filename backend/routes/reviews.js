import express from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get reviews for a rigger (public)
router.get('/rigger/:riggerId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ rigger: req.params.riggerId })
      .populate('reviewer', 'profile email')
      .populate('order', 'pricing')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Review.countDocuments({ rigger: req.params.riggerId });

    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: { rigger: new mongoose.Types.ObjectId(req.params.riggerId) } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      averageRating: avgRating[0]?.avg || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a review
router.post('/', authenticate, async (req, res) => {
  try {
    const { riggerId, rating, comment, orderId, listingId } = req.body;

    // Check if user already reviewed this rigger
    const existingReview = await Review.findOne({
      rigger: riggerId,
      reviewer: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this rigger' });
    }

    const review = new Review({
      rigger: riggerId,
      reviewer: req.user._id,
      rating,
      comment,
      order: orderId,
      listing: listingId
    });

    await review.save();
    await review.populate('reviewer', 'profile email');

    // Update rigger's average rating and total reviews
    const reviews = await Review.find({ rigger: riggerId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await User.findByIdAndUpdate(riggerId, {
      'riggerInfo.averageRating': Math.round(avgRating * 10) / 10,
      'riggerInfo.totalReviews': reviews.length
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update review helpful count
router.put('/:id/helpful', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.helpful = (review.helpful || 0) + 1;
    await review.save();

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

