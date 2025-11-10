import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, profile } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      role,
      profile
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        riggerInfo: user.riggerInfo
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      profile: req.user.profile,
      riggerInfo: req.user.riggerInfo,
      paymentInfo: req.user.paymentInfo
    }
  });
});

// Test route to verify PUT method works
router.put('/test', (req, res) => {
  res.json({ message: 'PUT method works', method: 'PUT', path: '/api/auth/test' });
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    console.log('PUT /api/auth/profile - Request received');
    console.log('User ID:', req.user?._id);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    
    const { profile, paymentInfo } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (profile) {
      // Merge profile data, preserving existing fields
      req.user.profile = {
        ...(req.user.profile || {}),
        ...profile,
        // Preserve address structure if it exists
        address: profile.address ? {
          ...(req.user.profile?.address || {}),
          ...profile.address
        } : req.user.profile?.address
      };
    }
    
    if (paymentInfo) {
      req.user.paymentInfo = {
        ...(req.user.paymentInfo || {}),
        ...paymentInfo
      };
    }
    
    const savedUser = await req.user.save();
    
    console.log('Profile updated successfully for user:', savedUser._id);
    
    res.json({
      success: true,
      user: {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        profile: savedUser.profile,
        riggerInfo: savedUser.riggerInfo,
        paymentInfo: savedUser.paymentInfo
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;

