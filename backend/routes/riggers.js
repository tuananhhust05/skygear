import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Order from '../models/Order.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Search riggers with filters
router.get('/search', async (req, res) => {
  try {
    const {
      email,
      name,
      phone,
      experience,
      responseTime,
      keyword, // Search in bio
      country,
      address
    } = req.query;

    const query = { role: 'rigger' };
    const orConditions = [];

    // Email search
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    // Name search (first name or last name)
    if (name) {
      orConditions.push(
        { 'profile.firstName': { $regex: name, $options: 'i' } },
        { 'profile.lastName': { $regex: name, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$profile.firstName', ' ', '$profile.lastName'] },
              regex: name,
              options: 'i'
            }
          }
        }
      );
    }

    // Phone search
    if (phone) {
      query['profile.phone'] = { $regex: phone, $options: 'i' };
    }

    // Experience filter
    if (experience) {
      query['riggerInfo.yearsOfExperience'] = parseInt(experience);
    }

    // Response time filter
    if (responseTime) {
      query['riggerInfo.responseTime'] = { $regex: responseTime, $options: 'i' };
    }

    // Keyword search in bio
    if (keyword) {
      query['riggerInfo.bio'] = { $regex: keyword, $options: 'i' };
    }

    // Country filter
    if (country) {
      query['riggerInfo.location.country'] = { $regex: country, $options: 'i' };
    }

    // Address filter (search in shopAddress or location fields)
    if (address) {
      orConditions.push(
        { 'riggerInfo.shopAddress': { $regex: address, $options: 'i' } },
        { 'riggerInfo.location.city': { $regex: address, $options: 'i' } },
        { 'riggerInfo.location.state': { $regex: address, $options: 'i' } },
        { 'profile.address.street': { $regex: address, $options: 'i' } },
        { 'profile.address.city': { $regex: address, $options: 'i' } }
      );
    }

    // Combine $or conditions if any
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const riggers = await User.find(query)
      .select('profile riggerInfo email')
      .limit(50);

    res.json(riggers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all riggers (for seller to search/select)
router.get('/', async (req, res) => {
  try {
    const riggers = await User.find({
      role: 'rigger'
    })
    .select('profile riggerInfo updatedAt email')
    .sort({ updatedAt: -1 }); // Sort by most recently updated

    res.json(riggers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get rigger by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const rigger = await User.findById(req.params.id)
      .select('profile riggerInfo')
      .where('role').equals('rigger');

    if (!rigger) {
      return res.status(404).json({ message: 'Rigger not found' });
    }

    res.json(rigger);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get rigger public profile with stats
router.get('/:id/public', async (req, res) => {
  try {
    // Find user by ID first
    const user = await User.findById(req.params.id)
      .select('profile riggerInfo email role createdAt');

    // Check if user exists and is a rigger
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'rigger') {
      return res.status(404).json({ message: 'Rigger not found' });
    }

    // Get stats (only if rigger has listings/orders) - use try/catch for each
    let totalListings = 0;
    let completedOrders = 0;
    let totalEarnings = 0;

    try {
      totalListings = await Listing.countDocuments({ rigger: req.params.id, status: 'listed' });
    } catch (error) {
      // Ignore errors, use default 0
    }

    try {
      completedOrders = await Order.countDocuments({ rigger: req.params.id, status: { $in: ['delivered', 'completed'] } });
    } catch (error) {
      // Ignore errors, use default 0
    }

    try {
      const earningsResult = await Order.aggregate([
        { $match: { rigger: new mongoose.Types.ObjectId(req.params.id), status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.fees.riggerFee' } } }
      ]);
      totalEarnings = earningsResult[0]?.total || 0;
    } catch (error) {
      // Ignore errors, use default 0
    }

    res.json({
      rigger: user,
      stats: {
        totalListings,
        completedOrders,
        totalEarnings
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update rigger profile
router.put('/:id/profile', authenticate, authorize('rigger'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { riggerInfo } = req.body;
    const rigger = await User.findById(req.params.id);

    if (!rigger || rigger.role !== 'rigger') {
      return res.status(404).json({ message: 'Rigger not found' });
    }

    // Update riggerInfo
    if (riggerInfo) {
      rigger.riggerInfo = {
        ...rigger.riggerInfo.toObject(),
        ...riggerInfo,
        // Preserve existing nested objects
        location: riggerInfo.location ? {
          ...(rigger.riggerInfo.location?.toObject() || {}),
          ...riggerInfo.location
        } : rigger.riggerInfo.location,
        socialMedia: riggerInfo.socialMedia ? {
          ...(rigger.riggerInfo.socialMedia?.toObject() || {}),
          ...riggerInfo.socialMedia
        } : rigger.riggerInfo.socialMedia,
        businessHours: riggerInfo.businessHours ? {
          ...(rigger.riggerInfo.businessHours?.toObject() || {}),
          ...riggerInfo.businessHours
        } : rigger.riggerInfo.businessHours
      };
    }

    await rigger.save();

    res.json({
      success: true,
      rigger: {
        id: rigger._id,
        profile: rigger.profile,
        riggerInfo: rigger.riggerInfo
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get rigger statistics
router.get('/:id/stats', authenticate, authorize('rigger'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [totalListings, pendingInspections, activeListings, completedOrders, totalEarnings] = await Promise.all([
      Listing.countDocuments({ rigger: req.params.id }),
      Listing.countDocuments({ rigger: req.params.id, status: { $in: ['pending', 'inspection'] } }),
      Listing.countDocuments({ rigger: req.params.id, status: 'listed' }),
      Order.countDocuments({ rigger: req.params.id, status: { $in: ['delivered', 'completed'] } }),
      Order.aggregate([
        { $match: { rigger: new mongoose.Types.ObjectId(req.params.id), status: { $in: ['delivered', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.fees.riggerFee' } } }
      ])
    ]);

    res.json({
      totalListings,
      pendingInspections,
      activeListings,
      completedOrders,
      totalEarnings: totalEarnings[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all listings for rigger
router.get('/:id/listings', authenticate, authorize('rigger'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { status } = req.query;
    const query = { rigger: req.params.id };
    if (status) {
      query.status = status;
    }

    const listings = await Listing.find(query)
      .populate('seller', 'profile email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get incoming rigs for rigger
router.get('/:id/incoming', authenticate, authorize('rigger'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const listings = await Listing.find({
      rigger: req.params.id,
      status: { $in: ['pending', 'inspection'] }
    })
    .populate('seller', 'profile email')
    .sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update listing inspection
router.put('/:id/listings/:listingId/inspect', authenticate, authorize('rigger'), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const listing = await Listing.findById(req.params.listingId);
    if (!listing || listing.rigger.toString() !== req.params.id) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const { inspectionReport, listingPrice, title, description } = req.body;

    listing.inspectionReport = {
      ...listing.inspectionReport,
      ...inspectionReport,
      inspectionDate: new Date(),
      inspectorName: `${req.user.profile.firstName} ${req.user.profile.lastName}`
    };

    if (listingPrice) {
      listing.pricing.listingPrice = listingPrice;
      // Calculate fees: 10% rigger, 2% platform
      listing.pricing.fees.riggerFee = listingPrice * 0.10;
      listing.pricing.fees.platformFee = listingPrice * 0.02;
      listing.pricing.fees.totalFees = listing.pricing.fees.riggerFee + listing.pricing.fees.platformFee;
    }

    if (title) listing.listingInfo.title = title;
    if (description) listing.listingInfo.description = description;

    listing.status = 'listed';
    listing.listingInfo.publishedAt = new Date();

    await listing.save();

    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

