const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
    index: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  rentalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['Rental Fee', 'Security Deposit', 'Damage Charge', 'Late Fee', 'Extension Fee', 'Other'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Check', 'Credit Card', 'Bank Transfer', 'Online Payment'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Partially Paid'],
    default: 'Pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: Date,
  transactionId: String,
  reference: String,
  notes: String,
  lateFee: {
    amount: { type: Number, default: 0 },
    appliedDate: Date
  },
  refund: {
    amount: Number,
    reason: String,
    processedDate: Date,
    refundMethod: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
paymentSchema.index({ dealerId: 1, status: 1 });
paymentSchema.index({ dealerId: 1, customerId: 1 });
paymentSchema.index({ dealerId: 1, rentalId: 1 });
paymentSchema.index({ dealerId: 1, dueDate: 1 });

module.exports = mongoose.model('Payment', paymentSchema);