const PaymentRecord = require('../models/PaymentRecord');
const Customer = require('../models/Customer');
const RentalHistory = require('../models/RentalHistory');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const payments = await PaymentRecord.find({ dealerId })
      .populate('customer_id', 'name contact_number')
      .populate('rental_id', 'rented_on rental_amount')
      .sort({ payment_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PaymentRecord.countDocuments({ dealerId });

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res) => {
  try {
    const payment = await PaymentRecord.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    })
    .populate('customer_id')
    .populate('rental_id');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment'
    });
  }
};

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
    const { customer_id, rental_id, amount_paid, outstanding_due, payment_method, transaction_reference, notes } = req.body;
    const dealerId = req.dealerId;

    // Verify customer and rental belong to dealer
    const customer = await Customer.findOne({ _id: customer_id, dealerId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const rental = await RentalHistory.findOne({ _id: rental_id, dealerId });
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    const payment = await PaymentRecord.create({
      dealerId,
      customer_id,
      rental_id,
      amount_paid,
      outstanding_due,
      payment_method,
      transaction_reference,
      notes
    });

    // Update customer's total outstanding due
    const totalOutstanding = await PaymentRecord.aggregate([
      { $match: { customer_id: customer._id, dealerId } },
      { $group: { _id: null, total: { $sum: '$outstanding_due' } } }
    ]);

    customer.total_outstanding_due = totalOutstanding[0]?.total || 0;
    await customer.save();

    const populatedPayment = await PaymentRecord.findById(payment._id)
      .populate('customer_id', 'name contact_number')
      .populate('rental_id', 'rented_on rental_amount');

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: populatedPayment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment'
    });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res) => {
  try {
    const payment = await PaymentRecord.findOneAndUpdate(
      { _id: req.params.id, dealerId: req.dealerId },
      req.body,
      { new: true, runValidators: true }
    )
    .populate('customer_id', 'name contact_number')
    .populate('rental_id', 'rented_on rental_amount');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update customer's total outstanding due
    const customer = await Customer.findById(payment.customer_id._id);
    const totalOutstanding = await PaymentRecord.aggregate([
      { $match: { customer_id: customer._id, dealerId: req.dealerId } },
      { $group: { _id: null, total: { $sum: '$outstanding_due' } } }
    ]);

    customer.total_outstanding_due = totalOutstanding[0]?.total || 0;
    await customer.save();

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment'
    });
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res) => {
  try {
    const payment = await PaymentRecord.findOneAndDelete({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update customer's total outstanding due
    const customer = await Customer.findById(payment.customer_id);
    const totalOutstanding = await PaymentRecord.aggregate([
      { $match: { customer_id: customer._id, dealerId: req.dealerId } },
      { $group: { _id: null, total: { $sum: '$outstanding_due' } } }
    ]);

    customer.total_outstanding_due = totalOutstanding[0]?.total || 0;
    await customer.save();

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting payment'
    });
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment
};