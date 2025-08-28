const { body, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules for dealer registration
exports.validateDealerRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Business name must be between 2 and 200 characters')
];

// Validation rules for dealer login
exports.validateDealerLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for customer creation
exports.validateCustomer = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('businessType')
    .isIn(['Construction', 'Landscaping', 'Agriculture', 'Mining', 'Transportation', 'Other'])
    .withMessage('Please select a valid business type')
];

// Validation rules for vehicle creation
exports.validateVehicle = [
  body('vehicleId')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Vehicle ID must be between 3 and 50 characters'),
  body('type')
    .isIn(['Bulldozer', 'Excavator', 'Loader', 'Crane', 'Grader', 'Dump Truck', 'Forklift', 'Backhoe', 'Skid Steer', 'Other'])
    .withMessage('Please select a valid vehicle type'),
  body('model')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Model must be between 2 and 100 characters'),
  body('manufacturer')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Manufacturer must be between 2 and 100 characters'),
  body('year')
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Please provide a valid year'),
  body('dailyRate')
    .isFloat({ min: 0 })
    .withMessage('Daily rate must be a positive number')
];

// Validation rules for rental creation
exports.validateRental = [
  body('customerId')
    .isMongoId()
    .withMessage('Please provide a valid customer ID'),
  body('vehicleId')
    .isMongoId()
    .withMessage('Please provide a valid vehicle ID'),
  body('startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('expectedEndDate')
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  body('rentalType')
    .isIn(['Daily', 'Weekly', 'Monthly', 'Custom'])
    .withMessage('Please select a valid rental type'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number')
];