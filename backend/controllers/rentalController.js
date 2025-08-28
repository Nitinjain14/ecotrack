const RentalHistory = require('../models/RentalHistory');
const Machine = require('../models/Machine');
const Customer = require('../models/Customer');
const PaymentRecord = require('../models/PaymentRecord');

// @desc    Get all rentals
// @route   GET /api/rentals
// @access  Private
const getRentals = async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    
    let query = { dealerId };
    if (status) query.status = status;

    const rentals = await RentalHistory.find(query)
      .populate('customer_id', 'name contact_number')
      .populate('machine_id', 'machine_name machine_type model')
      .sort({ rented_on: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RentalHistory.countDocuments(query);

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
};

// @desc    Get single rental
// @route   GET /api/rentals/:id
// @access  Private
const getRental = async (req, res) => {
  try {
    const rental = await RentalHistory.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    })
    .populate('customer_id')
    .populate('machine_id');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Get payment records for this rental
    const payments = await PaymentRecord.find({ 
      rental_id: rental._id,
      dealerId: req.dealerId 
    }).sort({ payment_date: -1 });

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
};

// @desc    Create new rental
// @route   POST /api/rentals
// @access  Private
const createRental = async (req, res) => {
  try {
    const { customer_id, machine_id, rental_amount, security_deposit, notes } = req.body;
    const dealerId = req.dealerId;

    // Verify customer belongs to dealer
    const customer = await Customer.findOne({ _id: customer_id, dealerId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Verify machine belongs to dealer and is available
    const machine = await Machine.findOne({ _id: machine_id, dealerId });
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    if (machine.condition !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Machine is not available for rental'
      });
    }

    // Create rental record
    const rental = await RentalHistory.create({
      dealerId,
      customer_id,
      machine_id,
      rental_amount,
      security_deposit: security_deposit || 0,
      notes,
      status: 'active'
    });

    // Update machine status
    machine.condition = 'rented';
    machine.current_rental_id = rental._id;
    await machine.save();

    // Update customer rental count
    customer.total_rentals += 1;
    await customer.save();

    // Create initial payment record (outstanding)
    await PaymentRecord.create({
      dealerId,
      customer_id,
      rental_id: rental._id,
      amount_paid: 0,
      outstanding_due: rental_amount + (security_deposit || 0),
      payment_method: 'pending'
    });

    const populatedRental = await RentalHistory.findById(rental._id)
      .populate('customer_id', 'name contact_number')
      .populate('machine_id', 'machine_name machine_type model');

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
};

// @desc    Update rental (return machine)
// @route   PUT /api/rentals/:id
// @access  Private
const updateRental = async (req, res) => {
  try {
    const { return_condition, notes } = req.body;

    const rental = await RentalHistory.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    }).populate('machine_id');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Rental is not active'
      });
    }

    // Update rental record
    rental.returned_on = new Date();
    rental.return_condition = return_condition;
    rental.status = 'completed';
    if (notes) rental.notes = notes;
    await rental.save();

    // Update machine status
    const machine = rental.machine_id;
    machine.condition = 'available';
    machine.current_rental_id = null;
    machine.expected_return_date = null;
    await machine.save();

    res.json({
      success: true,
      message: 'Rental updated successfully',
      data: rental
    });
  } catch (error) {
    console.error('Update rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating rental'
    });
  }
};

// @desc    Delete rental
// @route   DELETE /api/rentals/:id
// @access  Private
const deleteRental = async (req, res) => {
  try {
    const rental = await RentalHistory.findOneAndDelete({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // If rental was active, update machine status
    if (rental.status === 'active') {
      await Machine.findByIdAndUpdate(rental.machine_id, {
        condition: 'available',
        current_rental_id: null,
        expected_return_date: null
      });
    }

    res.json({
      success: true,
      message: 'Rental deleted successfully'
    });
  } catch (error) {
    console.error('Delete rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting rental'
    });
  }
};

module.exports = {
  getRentals,
  getRental,
  createRental,
  updateRental,
  deleteRental
};