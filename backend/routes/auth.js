const express = require('express');
const jwt = require('jsonwebtoken');
const Dealer = require('../models/Dealer');
const { protect } = require('../middlewares/auth');
const { 
  validateDealerRegistration, 
  validateDealerLogin, 
  handleValidationErrors 
} = require('../middlewares/validation');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @route   POST /api/auth/register
// @desc    Register a new dealer
// @access  Public
router.post('/register', validateDealerRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, phone, businessName, address, role, parentDealer } = req.body;

    // Check if dealer already exists
    const existingDealer = await Dealer.findOne({ email });
    if (existingDealer) {
      return res.status(400).json({
        success: false,
        message: 'Dealer with this email already exists'
      });
    }

    // Create dealer
    const dealer = await Dealer.create({
      name,
      email,
      password,
      phone,
      businessName,
      address,
      role: role || 'dealer',
      parentDealer: role === 'staff' ? parentDealer : null
    });

    // Generate token
    const token = generateToken(dealer._id);

    res.status(201).json({
      success: true,
      message: 'Dealer registered successfully',
      token,
      dealer: {
        id: dealer._id,
        name: dealer.name,
        email: dealer.email,
        businessName: dealer.businessName,
        role: dealer.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login dealer
// @access  Public
router.post('/login', validateDealerLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if dealer exists and get password
    const dealer = await Dealer.findOne({ email }).select('+password');
    if (!dealer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!dealer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Validate password
    const isMatch = await dealer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    dealer.lastLogin = new Date();
    await dealer.save();

    // Generate token
    const token = generateToken(dealer._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      dealer: {
        id: dealer._id,
        name: dealer.name,
        email: dealer.email,
        businessName: dealer.businessName,
        role: dealer.role,
        parentDealer: dealer.parentDealer,
        preferences: dealer.preferences,
        lastLogin: dealer.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current dealer info
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.dealer._id).populate('parentDealer', 'name businessName');
    
    res.json({
      success: true,
      dealer: {
        id: dealer._id,
        name: dealer.name,
        email: dealer.email,
        phone: dealer.phone,
        businessName: dealer.businessName,
        address: dealer.address,
        role: dealer.role,
        parentDealer: dealer.parentDealer,
        preferences: dealer.preferences,
        lastLogin: dealer.lastLogin,
        createdAt: dealer.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting profile'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout dealer (client-side token removal)
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;