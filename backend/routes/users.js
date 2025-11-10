import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Order from '../models/Order.js';

const router = express.Router();

// Get seller public profile with stats
router.get('/seller/:id/public', async (req, res) => {
  try {
    const seller = await User.findById(req.params.id)
      .select('profile email')
      .where('role').equals('seller');

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get stats
    const [totalListings, activeListings, soldListings, totalEarnings] = await Promise.all([
      Listing.countDocuments({ seller: req.params.id }),
      Listing.countDocuments({ seller: req.params.id, status: 'listed' }),
      Listing.countDocuments({ seller: req.params.id, status: 'sold' }),
      Order.aggregate([
        { $match: { seller: new mongoose.Types.ObjectId(req.params.id), status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.fees.sellerAmount' } } }
      ])
    ]);

    res.json({
      user: seller,
      stats: {
        totalListings,
        activeListings,
        soldListings,
        totalEarnings: totalEarnings[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get buyer public profile with stats
router.get('/buyer/:id/public', async (req, res) => {
  try {
    const buyer = await User.findById(req.params.id)
      .select('profile email')
      .where('role').equals('buyer');

    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Get stats
    const [totalOrders, completedOrders, totalSpent] = await Promise.all([
      Order.countDocuments({ buyer: req.params.id }),
      Order.countDocuments({ buyer: req.params.id, status: { $in: ['delivered', 'completed'] } }),
      Order.aggregate([
        { $match: { buyer: new mongoose.Types.ObjectId(req.params.id), status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ])
    ]);

    res.json({
      user: buyer,
      stats: {
        totalOrders,
        completedOrders,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search users by name or email
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const searchQuery = q.trim();
    const users = await User.find({
      $or: [
        { email: { $regex: searchQuery, $options: 'i' } },
        { 'profile.firstName': { $regex: searchQuery, $options: 'i' } },
        { 'profile.lastName': { $regex: searchQuery, $options: 'i' } },
        { 
          $expr: {
            $regexMatch: {
              input: { $concat: ['$profile.firstName', ' ', '$profile.lastName'] },
              regex: searchQuery,
              options: 'i'
            }
          }
        }
      ]
    })
    .select('profile email role')
    .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID (generic, for any role)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('profile email role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

