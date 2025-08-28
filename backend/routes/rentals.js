const express = require('express');
const moment = require('moment');
const { protect, ensureDataIsolation } = require('../middlewares/auth');
const { validateRental, handleValidationErrors } = require('../middlewares/validation');
const Rental = require('../models/Rental');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const { generateRentalId, generatePaymentId } = require('../utils/generateId');
const { generateVehicleDamageAlerts } = require('../utils/alertGenerator');

const router = express.Router();

// @route   GET /api/rentals
// @desc    Get all rentals for dealer
// @access  Private
router.get('/', protect, ensureDataIsolation, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const search = req.query.search || '';
    
    // Build query
    let query = { dealerId };
    
    if (status) query.status = status;
    
    if (search) {
      // Search in rental ID, customer name, or vehicle ID
      const customers = await Customer.find({
        dealerId,
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      const vehicles = await Vehicle.find({
        dealerId,
        vehicleId: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { rentalId: { $regex: search, $options: 'i' } },
        { customerId: { $in: customers.map(c => c._id) } },
        { vehicleId: { $in: vehicles.map(v => v._id) } }
      ];
    }

    const rentals = await Rental.find(query)
      .populate('customerId', 'name customerId email phone')
      .populate('vehicleId', 'vehicleId type model manufacturer')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rental.countDocuments(query);

    res.json({
      success: true,
      data: rentals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get rentals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rentals'
    });
  }
});

// @route   GET /api/rentals/:id
// @desc    Get single rental
// @access  Private
router.get('/:id', protect, ensureDataIsolation, async (req, res) => {
  try {
    const rental = await Rental.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    })
    .populate('customerId')
    .populate('vehicleId');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Get associated payments
    const payments = await Payment.find({ rentalId: rental._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        rental,
        payments
      }
    });
  } catch (error) {
    console.error('Get rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rental'
    });
  }
});

// @route   POST /api/rentals
// @desc    Create new rental
// @access  Private
router.post('/', protect, validateRental, handleValidationErrors, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    
    // Verify customer belongs to dealer
    const customer = await Customer.findOne({
      _id: req.body.customerId,
      dealerId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Verify vehicle belongs to dealer and is available
    const vehicle = await Vehicle.findOne({
      _id: req.body.vehicleId,
      dealerId
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for rental'
      });
    }

    // Generate rental ID
    const rentalId = generateRentalId(dealerId);

    // Create rental
    const rental = await Rental.create({
      ...req.body,
      dealerId,
      rentalId
    });

    // Update vehicle status
    vehicle.status = 'Rented';
    vehicle.currentRental = rental._id;
    vehicle.expectedReturnDate = rental.expectedEndDate;
    await vehicle.save();

    // Update customer rental count
    customer.totalRentals += 1;
    customer.rentalHistory.push({
      vehicleId: vehicle._id,
      rentalId: rental._id,
      startDate: rental.startDate,
      endDate: rental.expectedEndDate,
      totalAmount: rental.totalAmount,
      paidAmount: 0
    });
    await customer.save();

    // Create initial payment record
    const paymentId = generatePaymentId(dealerId);
    await Payment.create({
      dealerId,
      paymentId,
      rentalId: rental._id,
      customerId: customer._id,
      amount: rental.totalAmount,
      paymentType: 'Rental Fee',
      paymentMethod: 'Pending',
      status: 'Pending',
      dueDate: moment(rental.startDate).add(7, 'days').toDate()
    });

    const populatedRental = await Rental.findById(rental._id)
      .populate('customerId', 'name customerId')
      .populate('vehicleId', 'vehicleId type model');

    res.status(201).json({
      success: true,
      message: 'Rental created successfully',
      data: populatedRental
    });
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating rental'
    });
  }
});

// @route   PUT /api/rentals/:id/return
// @desc    Process vehicle return
// @access  Private
router.put('/:id/return', protect, async (req, res) => {
  try {
    const { 
      returnCondition, 
      notes, 
      images, 
      checkedBy, 
      damageCharges = 0,
      actualEndDate 
    } = req.body;

    const rental = await Rental.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    }).populate('vehicleId customerId');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    if (rental.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Rental is not active'
      });
    }

    // Update rental with return information
    rental.actualEndDate = actualEndDate || new Date();
    rental.status = 'Completed';
    rental.returnCondition = {
      condition: returnCondition,
      notes,
      images,
      checkedBy,
      checkDate: new Date(),
      damageCharges
    };

    // Check if rental is overdue
    if (moment(rental.actualEndDate).isAfter(moment(rental.expectedEndDate))) {
      rental.status = 'Overdue';
    }

    await rental.save();

    // Update vehicle status and condition
    const vehicle = rental.vehicleId;
    vehicle.status = 'Available';
    vehicle.currentRental = null;
    vehicle.expectedReturnDate = null;
    
    // Update vehicle condition based on return condition
    if (returnCondition === 'Damaged') {
      vehicle.condition = 'Needs Inspection';
    } else if (returnCondition === 'Fair' && vehicle.condition === 'Good') {
      vehicle.condition = 'Fair';
    }

    // Add to rental history
    vehicle.rentalHistory.push({
      rentalId: rental._id,
      customerId: rental.customerId._id,
      startDate: rental.startDate,
      endDate: rental.actualEndDate,
      returnCondition,
      totalHours: moment(rental.actualEndDate).diff(moment(rental.startDate), 'hours')
    });

    vehicle.totalRentalHours += moment(rental.actualEndDate).diff(moment(rental.startDate), 'hours');
    await vehicle.save();

    // Update customer rental history
    const customer = rental.customerId;
    const historyIndex = customer.rentalHistory.findIndex(
      h => h.rentalId.toString() === rental._id.toString()
    );
    
    if (historyIndex !== -1) {
      customer.rentalHistory[historyIndex].endDate = rental.actualEndDate;
      customer.rentalHistory[historyIndex].returnCondition = returnCondition;
    }

    await customer.save();

    // Create damage charges payment if applicable
    if (damageCharges > 0) {
      const paymentId = generatePaymentId(req.dealerId);
      await Payment.create({
        dealerId: req.dealerId,
        paymentId,
        rentalId: rental._id,
        customerId: rental.customerId._id,
        amount: damageCharges,
        paymentType: 'Damage Charge',
        paymentMethod: 'Pending',
        status: 'Pending',
        dueDate: moment().add(7, 'days').toDate()
      });

      // Generate damage alert
      await generateVehicleDamageAlerts(req.dealerId, rental._id, notes);
    }

    res.json({
      success: true,
      message: 'Vehicle returned successfully',
      data: rental
    });
  } catch (error) {
    console.error('Return rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing vehicle return'
    });
  }
});

// @route   PUT /api/rentals/:id/extend
// @desc    Extend rental period
// @access  Private
router.put('/:id/extend', protect, async (req, res) => {
  try {
    const { newEndDate, additionalAmount } = req.body;

    const rental = await Rental.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    }).populate('vehicleId');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    if (rental.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Can only extend active rentals'
      });
    }

    // Update rental
    rental.expectedEndDate = newEndDate;
    rental.totalAmount += additionalAmount;
    await rental.save();

    // Update vehicle expected return date
    const vehicle = rental.vehicleId;
    vehicle.expectedReturnDate = newEndDate;
    await vehicle.save();

    // Create extension fee payment
    if (additionalAmount > 0) {
      const paymentId = generatePaymentId(req.dealerId);
      await Payment.create({
        dealerId: req.dealerId,
        paymentId,
        rentalId: rental._id,
        customerId: rental.customerId,
        amount: additionalAmount,
        paymentType: 'Extension Fee',
        paymentMethod: 'Pending',
        status: 'Pending',
        dueDate: moment().add(7, 'days').toDate()
      });
    }

    res.json({
      success: true,
      message: 'Rental extended successfully',
      data: rental
    });
  } catch (error) {
    console.error('Extend rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Error extending rental'
    });
  }
});

// @route   PUT /api/rentals/:id/cancel
// @desc    Cancel rental
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason, cancellationFee = 0 } = req.body;

    const rental = await Rental.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    }).populate('vehicleId');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    if (rental.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel active rentals'
      });
    }

    // Update rental status
    rental.status = 'Cancelled';
    rental.notes = `Cancelled: ${reason}`;
    await rental.save();

    // Update vehicle status
    const vehicle = rental.vehicleId;
    vehicle.status = 'Available';
    vehicle.currentRental = null;
    vehicle.expectedReturnDate = null;
    await vehicle.save();

    // Create cancellation fee payment if applicable
    if (cancellationFee > 0) {
      const paymentId = generatePaymentId(req.dealerId);
      await Payment.create({
        dealerId: req.dealerId,
        paymentId,
        rentalId: rental._id,
        customerId: rental.customerId,
        amount: cancellationFee,
        paymentType: 'Other',
        paymentMethod: 'Pending',
        status: 'Pending',
        dueDate: moment().add(7, 'days').toDate()
      });
    }

    res.json({
      success: true,
      message: 'Rental cancelled successfully',
      data: rental
    });
  } catch (error) {
    console.error('Cancel rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling rental'
    });
  }
});

module.exports = router;