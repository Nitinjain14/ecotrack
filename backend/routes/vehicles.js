const express = require('express');
const { protect, ensureDataIsolation } = require('../middlewares/auth');
const { validateVehicle, handleValidationErrors } = require('../middlewares/validation');
const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');
const { generateVehicleId } = require('../utils/generateId');

const router = express.Router();

// @route   GET /api/vehicles
// @desc    Get all vehicles for dealer
// @access  Private
router.get('/', protect, ensureDataIsolation, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const type = req.query.type || '';
    const status = req.query.status || '';
    const condition = req.query.condition || '';
    
    // Build query
    let query = { dealerId, isActive: true };
    
    if (search) {
      query.$or = [
        { vehicleId: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (condition) query.condition = condition;

    const vehicles = await Vehicle.find(query)
      .populate('currentRental', 'rentalId customerId expectedEndDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vehicle.countDocuments(query);

    res.json({
      success: true,
      data: vehicles,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles'
    });
  }
});

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle
// @access  Private
router.get('/:id', protect, ensureDataIsolation, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    }).populate('currentRental');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Get vehicle's rental history
    const rentalHistory = await Rental.find({ vehicleId: vehicle._id })
      .populate('customerId', 'name customerId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        vehicle,
        rentalHistory
      }
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle'
    });
  }
});

// @route   POST /api/vehicles
// @desc    Create new vehicle
// @access  Private
router.post('/', protect, validateVehicle, handleValidationErrors, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    
    // Check if vehicle ID already exists for this dealer
    const existingVehicle = await Vehicle.findOne({
      dealerId,
      vehicleId: req.body.vehicleId
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this ID already exists'
      });
    }

    // Check if serial number already exists
    const existingSerial = await Vehicle.findOne({
      serialNumber: req.body.serialNumber
    });

    if (existingSerial) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this serial number already exists'
      });
    }

    // Generate vehicle ID if not provided
    let vehicleId = req.body.vehicleId;
    if (!vehicleId) {
      vehicleId = generateVehicleId(dealerId, req.body.type);
    }

    const vehicle = await Vehicle.create({
      ...req.body,
      dealerId,
      vehicleId
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating vehicle'
    });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private
router.put('/:id', protect, validateVehicle, handleValidationErrors, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, dealerId: req.dealerId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle'
    });
  }
});

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle (soft delete)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check if vehicle is currently rented
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (vehicle.status === 'Rented') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle that is currently rented'
      });
    }

    vehicle.isActive = false;
    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle'
    });
  }
});

// @route   GET /api/vehicles/available/list
// @desc    Get available vehicles for rental
// @access  Private
router.get('/available/list', protect, ensureDataIsolation, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const type = req.query.type || '';
    
    let query = { 
      dealerId, 
      isActive: true, 
      status: 'Available',
      condition: { $in: ['Good', 'Fair'] }
    };
    
    if (type) query.type = type;

    const availableVehicles = await Vehicle.find(query)
      .select('vehicleId type model manufacturer year dailyRate weeklyRate monthlyRate location')
      .sort({ type: 1, vehicleId: 1 });

    res.json({
      success: true,
      data: availableVehicles
    });
  } catch (error) {
    console.error('Get available vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available vehicles'
    });
  }
});

// @route   PUT /api/vehicles/:id/maintenance
// @desc    Update vehicle maintenance schedule
// @access  Private
router.put('/:id/maintenance', protect, async (req, res) => {
  try {
    const { lastMaintenance, nextMaintenance, maintenanceType, notes } = req.body;
    
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, dealerId: req.dealerId },
      {
        'maintenanceSchedule.lastMaintenance': lastMaintenance,
        'maintenanceSchedule.nextMaintenance': nextMaintenance,
        'maintenanceSchedule.maintenanceType': maintenanceType,
        'maintenanceSchedule.notes': notes
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Maintenance schedule updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Update maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating maintenance schedule'
    });
  }
});

module.exports = router;