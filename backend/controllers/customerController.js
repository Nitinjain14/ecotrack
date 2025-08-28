const Customer = require('../models/Customer');
const RentalHistory = require('../models/RentalHistory');
const PaymentRecord = require('../models/PaymentRecord');
const Machine = require('../models/Machine');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    let query = { dealerId, isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact_number: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
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
};

// @desc    Get single customer with details
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = async (req, res) => {
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

    // Get rental history with machine details
    const rentalHistory = await RentalHistory.find({ 
      customer_id: customer._id,
      dealerId: req.dealerId 
    })
    .populate('machine_id', 'machine_name machine_type model')
    .sort({ rented_on: -1 });

    // Get payment records
    const paymentRecords = await PaymentRecord.find({ 
      customer_id: customer._id,
      dealerId: req.dealerId 
    })
    .populate('rental_id', 'rented_on')
    .sort({ payment_date: -1 });

    // Calculate payment summary
    const totalPaid = paymentRecords.reduce((sum, payment) => sum + payment.amount_paid, 0);
    const totalOutstanding = paymentRecords.reduce((sum, payment) => sum + payment.outstanding_due, 0);

    // Get frequently rented machines
    const machineRentals = {};
    rentalHistory.forEach(rental => {
      const machineId = rental.machine_id._id.toString();
      if (!machineRentals[machineId]) {
        machineRentals[machineId] = {
          machine: rental.machine_id,
          count: 0
        };
      }
      machineRentals[machineId].count++;
    });

    const frequentlyRentedMachines = Object.values(machineRentals)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        customer,
        rentalHistory,
        paymentRecords,
        paymentSummary: {
          totalPaid,
          totalOutstanding
        },
        frequentlyRentedMachines
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer'
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      dealerId: req.dealerId
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
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
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
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
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
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};