const express = require('express');
const moment = require('moment');
const { protect, ensureDataIsolation } = require('../middlewares/auth');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');

const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments for dealer
// @access  Private
router.get('/', protect, ensureDataIsolation, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const paymentType = req.query.paymentType || '';
    const search = req.query.search || '';
    
    // Build query
    let query = { dealerId };
    
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    
    if (search) {
      // Search in payment ID, customer name, or rental ID
      const customers = await Customer.find({
        dealerId,
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      const rentals = await Rental.find({
        dealerId,
        rentalId: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { paymentId: { $regex: search, $options: 'i' } },
        { customerId: { $in: customers.map(c => c._id) } },
        { rentalId: { $in: rentals.map(r => r._id) } }
      ];
    }

    const payments = await Payment.find(query)
      .populate('customerId', 'name customerId email')
      .populate('rentalId', 'rentalId vehicleId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

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
});

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get('/:id', protect, ensureDataIsolation, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    })
    .populate('customerId')
    .populate('rentalId');

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
});

// @route   PUT /api/payments/:id/process
// @desc    Process payment
// @access  Private
router.put('/:id/process', protect, async (req, res) => {
  try {
    const { 
      paymentMethod, 
      transactionId, 
      reference, 
      paidAmount, 
      notes 
    } = req.body;

    const payment = await Payment.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    }).populate('customerId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    const amountToPay = paidAmount || payment.amount;
    
    // Update payment
    payment.paymentMethod = paymentMethod;
    payment.transactionId = transactionId;
    payment.reference = reference;
    payment.paidDate = new Date();
    payment.notes = notes;

    if (amountToPay >= payment.amount) {
      payment.status = 'Completed';
    } else {
      payment.status = 'Partially Paid';
      // Create a new payment record for remaining amount
      const remainingAmount = payment.amount - amountToPay;
      // Implementation for partial payment handling would go here
    }

    await payment.save();

    // Update customer balance
    const customer = payment.customerId;
    if (payment.paymentType === 'Rental Fee') {
      customer.currentBalance -= amountToPay;
    }
    
    customer.paymentHistory.push({
      amount: amountToPay,
      date: new Date(),
      method: paymentMethod,
      reference: reference || transactionId
    });
    
    await customer.save();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment'
    });
  }
});

// @route   PUT /api/payments/:id/refund
// @desc    Process payment refund
// @access  Private
router.put('/:id/refund', protect, async (req, res) => {
  try {
    const { refundAmount, reason, refundMethod } = req.body;

    const payment = await Payment.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed payment amount'
      });
    }

    // Update payment with refund information
    payment.refund = {
      amount: refundAmount,
      reason,
      processedDate: new Date(),
      refundMethod
    };

    if (refundAmount === payment.amount) {
      payment.status = 'Refunded';
    }

    await payment.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund'
    });
  }
});

// @route   GET /api/payments/overdue/list
// @desc    Get overdue payments
// @access  Private
router.get('/overdue/list', protect, ensureDataIsolation, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    
    const overduePayments = await Payment.find({
      dealerId,
      status: { $in: ['Pending', 'Partially Paid'] },
      dueDate: { $lt: new Date() }
    })
    .populate('customerId', 'name customerId email phone')
    .populate('rentalId', 'rentalId vehicleId')
    .sort({ dueDate: 1 });

    // Calculate late fees for overdue payments
    const paymentsWithLateFees = overduePayments.map(payment => {
      const daysOverdue = moment().diff(moment(payment.dueDate), 'days');
      const lateFeeRate = 0.05; // 5% per month
      const lateFee = Math.floor(payment.amount * lateFeeRate * (daysOverdue / 30));
      
      return {
        ...payment.toObject(),
        daysOverdue,
        calculatedLateFee: lateFee
      };
    });

    res.json({
      success: true,
      data: paymentsWithLateFees
    });
  } catch (error) {
    console.error('Get overdue payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue payments'
    });
  }
});

// @route   PUT /api/payments/:id/late-fee
// @desc    Apply late fee to payment
// @access  Private
router.put('/:id/late-fee', protect, async (req, res) => {
  try {
    const { lateFeeAmount } = req.body;

    const payment = await Payment.findOne({
      _id: req.params.id,
      dealerId: req.dealerId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.lateFee.amount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Late fee already applied to this payment'
      });
    }

    // Apply late fee
    payment.lateFee = {
      amount: lateFeeAmount,
      appliedDate: new Date()
    };
    payment.amount += lateFeeAmount;

    await payment.save();

    res.json({
      success: true,
      message: 'Late fee applied successfully',
      data: payment
    });
  } catch (error) {
    console.error('Apply late fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying late fee'
    });
  }
});

module.exports = router;