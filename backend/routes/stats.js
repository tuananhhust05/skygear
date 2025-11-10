import express from 'express';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Order from '../models/Order.js';

const router = express.Router();

// Get platform statistics
router.get('/', async (req, res) => {
  try {
    const [
      totalUsers,
      totalRiggers,
      totalListings,
      totalOrders,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'rigger', 'riggerInfo.verificationStatus': 'approved' }),
      Listing.countDocuments({ status: 'listed' }),
      Order.countDocuments({ status: { $in: ['paid', 'shipped', 'delivered', 'completed'] } }),
      Order.aggregate([
        { $match: { status: { $in: ['paid', 'shipped', 'delivered', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ])
    ]);

    res.json({
      totalUsers,
      totalRiggers,
      totalListings,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

