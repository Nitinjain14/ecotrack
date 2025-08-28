const express = require('express');
const { protect, ensureDataIsolation } = require('../middlewares/auth');
const { validateCustomer, handleValidationErrors } = require('../middlewares/validation');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const Payment = require('../models/Payment');
const { generateCustomerId } = require('../utils/generateId');

const router = express.Router();

// @route   GET /api/customers
// @desc    Get all customers for dealer
// @access  Private
router.get('/', protect, ensureDataIsolation, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const businessType = req.query.businessType || '';
    
    // Build query
    let query = { dealerId, isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (businessType) {
      query.businessType = businessType;
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers'
    });
  }
});

// @route   GET /api/customers/:id
// @desc    Get single customer
// @access  Private
router.get('/:id', protect, ensureDataIsolation, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer's rental history
    const rentals = await Rental.find({ customerId: customer._id })
      .populate('vehicleId', 'vehicleId type model')
      .sort({ createdAt: -1 });

    // Get customer's payment history
    const payments = await Payment.find({ customerId: customer._id })
      .populate('rentalId', 'rentalId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        customer,
        rentals,
        payments
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer'
    });
  }
});

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private
router.post('/', protect, validateCustomer, handleValidationErrors, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    
    // Check if customer email already exists for this dealer
    const existingCustomer = await Customer.findOne({
      dealerId,
      email: req.body.email
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }

    // Generate unique customer ID
    const customerId = generateCustomerId(dealerId);

    const customer = await Customer.create({
      ...req.body,
      dealerId,
      customerId
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating customer'
    });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', protect, validateCustomer, handleValidationErrors, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, dealerId: req.dealerId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer'
    });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer (soft delete)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, dealerId: req.dealerId },
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer'
    });
  }
});

// @route   GET /api/customers/:id/analytics
// @desc    Get customer analytics
// @access  Private
router.get('/:id/analytics', protect, ensureDataIsolation, async (req, res) => {
  try {
    const customerId = req.params.id;
    const dealerId = req.dealerId;

    // Verify customer belongs to dealer
    const customer = await Customer.findOne({ _id: customerId, dealerId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get rental analytics
    const rentalAnalytics = await Rental.aggregate([
      { $match: { customerId: customer._id, dealerId } },
      {
        $group: {
          _id: null,
          totalRentals: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageRentalDuration: { 
            $avg: { 
              $divide: [
                { $subtract: ['$expectedEndDate', '$startDate'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        }
      }
    ]);

    // Get vehicle type preferences
    const vehiclePreferences = await Rental.aggregate([
      { $match: { customerId: customer._id, dealerId } },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $group: {
          _id: '$vehicle.type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get monthly rental pattern
    const monthlyPattern = await Rental.aggregate([
      { $match: { customerId: customer._id, dealerId } },
      {
        $group: {
          _id: { $month: '$startDate' },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: rentalAnalytics[0] || {
          totalRentals: 0,
          totalRevenue: 0,
          averageRentalDuration: 0
        },
        vehiclePreferences,
        monthlyPattern
      }
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer analytics'
    });
  }
});

module.exports = router;