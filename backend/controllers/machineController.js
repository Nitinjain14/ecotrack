const Machine = require('../models/Machine');
const RentalHistory = require('../models/RentalHistory');

// @desc    Get all machines
// @route   GET /api/machines
// @access  Private
const getMachines = async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const condition = req.query.condition || '';
    const machine_type = req.query.machine_type || '';
    
    let query = { dealerId, isActive: true };
    
    if (search) {
      query.$or = [
        { machine_name: { $regex: search, $options: 'i' } },
        { machine_type: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (condition) query.condition = condition;
    if (machine_type) query.machine_type = machine_type;

    const machines = await Machine.find(query)
      .populate('current_rental_id', 'customer_id rented_on')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Machine.countDocuments(query);

    res.json({
      success: true,
      data: machines,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get machines error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching machines'
    });
  }
};

// @desc    Get single machine with details
// @route   GET /api/machines/:id
// @access  Private
const getMachine = async (req, res) => {
  try {
    const machine = await Machine.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    }).populate('current_rental_id');

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Get rental history for this machine
    const rentalHistory = await RentalHistory.find({ 
      machine_id: machine._id,
      dealerId: req.dealerId 
    })
    .populate('customer_id', 'name contact_number')
    .sort({ rented_on: -1 });

    // Get current rental details if rented
    let currentRental = null;
    if (machine.condition === 'rented' && machine.current_rental_id) {
      currentRental = await RentalHistory.findById(machine.current_rental_id)
        .populate('customer_id', 'name contact_number');
    }

    res.json({
      success: true,
      data: {
        machine,
        rentalHistory,
        currentRental,
        availability: machine.condition,
        expectedReturnDate: machine.expected_return_date
      }
    });
  } catch (error) {
    console.error('Get machine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching machine'
    });
  }
};

// @desc    Create new machine
// @route   POST /api/machines
// @access  Private
const createMachine = async (req, res) => {
  try {
    const machine = await Machine.create({
      ...req.body,
      dealerId: req.dealerId
    });

    res.status(201).json({
      success: true,
      message: 'Machine created successfully',
      data: machine
    });
  } catch (error) {
    console.error('Create machine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating machine'
    });
  }
};

// @desc    Update machine
// @route   PUT /api/machines/:id
// @access  Private
const updateMachine = async (req, res) => {
  try {
    const machine = await Machine.findOneAndUpdate(
      { _id: req.params.id, dealerId: req.dealerId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.json({
      success: true,
      message: 'Machine updated successfully',
      data: machine
    });
  } catch (error) {
    console.error('Update machine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating machine'
    });
  }
};

// @desc    Delete machine
// @route   DELETE /api/machines/:id
// @access  Private
const deleteMachine = async (req, res) => {
  try {
    // Check if machine is currently rented
    const machine = await Machine.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    if (machine.condition === 'rented') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete machine that is currently rented'
      });
    }

    machine.isActive = false;
    await machine.save();

    res.json({
      success: true,
      message: 'Machine deleted successfully'
    });
  } catch (error) {
    console.error('Delete machine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting machine'
    });
  }
};

module.exports = {
  getMachines,
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine
};