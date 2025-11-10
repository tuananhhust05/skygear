import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Order from '../models/Order.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics based on user role
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let stats = {};

    if (role === 'seller') {
      const [
        totalListings,
        pendingListings,
        activeListings,
        soldListings,
        totalEarnings,
        pendingOrders
      ] = await Promise.all([
        Listing.countDocuments({ seller: userId }),
        Listing.countDocuments({ seller: userId, status: { $in: ['pending', 'inspection'] } }),
        Listing.countDocuments({ seller: userId, status: 'listed' }),
        Listing.countDocuments({ seller: userId, status: 'sold' }),
        Order.aggregate([
          { $match: { seller: new mongoose.Types.ObjectId(userId), status: { $in: ['delivered', 'completed'] } } },
          { $group: { _id: null, total: { $sum: '$pricing.fees.sellerAmount' } } }
        ]),
        Order.countDocuments({ seller: userId, status: { $in: ['pending', 'paid', 'shipped'] } })
      ]);

      stats = {
        totalListings,
        pendingListings,
        activeListings,
        soldListings,
        totalEarnings: totalEarnings[0]?.total || 0,
        pendingOrders
      };
    } else if (role === 'rigger') {
      const [
        totalListings,
        pendingInspections,
        activeListings,
        completedOrders,
        totalEarnings
      ] = await Promise.all([
        Listing.countDocuments({ rigger: userId }),
        Listing.countDocuments({ rigger: userId, status: { $in: ['pending', 'inspection'] } }),
        Listing.countDocuments({ rigger: userId, status: 'listed' }),
        Order.countDocuments({ rigger: userId, status: { $in: ['delivered', 'completed'] } }),
        Order.aggregate([
          { $match: { rigger: new mongoose.Types.ObjectId(userId), status: { $in: ['delivered', 'completed'] } } },
          { $group: { _id: null, total: { $sum: '$pricing.fees.riggerFee' } } }
        ])
      ]);

      stats = {
        totalListings,
        pendingInspections,
        activeListings,
        completedOrders,
        totalEarnings: totalEarnings[0]?.total || 0
      };
    } else if (role === 'buyer') {
      const [
        totalOrders,
        buyerPendingOrders,
        buyerCompletedOrders,
        totalSpent
      ] = await Promise.all([
        Order.countDocuments({ buyer: userId }),
        Order.countDocuments({ buyer: userId, status: { $in: ['pending', 'paid', 'shipped'] } }),
        Order.countDocuments({ buyer: userId, status: { $in: ['delivered', 'completed'] } }),
        Order.aggregate([
          { $match: { buyer: new mongoose.Types.ObjectId(userId), status: { $in: ['delivered', 'completed'] } } },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ])
      ]);

      stats = {
        totalOrders,
        buyerPendingOrders,
        buyerCompletedOrders,
        totalSpent: totalSpent[0]?.total || 0
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent activity
router.get('/activity', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let activities = [];

    if (role === 'seller') {
      const listings = await Listing.find({ seller: userId })
        .populate('rigger', 'profile')
        .sort({ updatedAt: -1 })
        .limit(5);
      
      activities = listings.map(listing => ({
        type: 'listing',
        id: listing._id,
        title: listing.listingInfo?.title || `${listing.rigDetails?.manufacturer} ${listing.rigDetails?.model}`,
        status: listing.status,
        date: listing.updatedAt
      }));
    } else if (role === 'rigger') {
      const listings = await Listing.find({ rigger: userId })
        .populate('seller', 'profile')
        .sort({ updatedAt: -1 })
        .limit(5);
      
      activities = listings.map(listing => ({
        type: 'listing',
        id: listing._id,
        title: listing.listingInfo?.title || `${listing.rigDetails?.manufacturer} ${listing.rigDetails?.model}`,
        status: listing.status,
        date: listing.updatedAt
      }));
    } else if (role === 'buyer') {
      const orders = await Order.find({ buyer: userId })
        .populate('listing')
        .sort({ updatedAt: -1 })
        .limit(5);
      
      activities = orders.map(order => ({
        type: 'order',
        id: order._id,
        title: order.listing?.listingInfo?.title || 'Order',
        status: order.status,
        date: order.updatedAt
      }));
    }

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

