const jwt = require('jsonwebtoken');
const Dealer = require('../models/Dealer');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get dealer from token
    const dealer = await Dealer.findById(decoded.id).select('-password');
    
    if (!dealer) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid. Dealer not found.'
      });
    }

    if (!dealer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    req.dealer = dealer;
    req.dealerId = dealer.getDealerId(); // Get the main dealer ID (for staff, this returns parent dealer)
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token is not valid.'
    });
  }
};

// Authorize roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.dealer.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.dealer.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Ensure dealer data isolation
exports.ensureDataIsolation = (req, res, next) => {
  // Add dealerId to query parameters for data isolation
  req.query.dealerId = req.dealerId;
  next();
};