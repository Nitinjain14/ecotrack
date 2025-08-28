const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
    index: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  rental_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalHistory',
    required: true
  },
  amount_paid: {
    type: Number,
    required: true,
    min: 0
  },
  payment_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  outstanding_due: {
    type: Number,
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['cash', 'check', 'credit_card', 'bank_transfer', 'online'],
    default: 'cash'
  },
  transaction_reference: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
paymentRecordSchema.index({ dealerId: 1, customer_id: 1 });
paymentRecordSchema.index({ dealerId: 1, payment_date: -1 });

module.exports = mongoose.model('PaymentRecord', paymentRecordSchema);