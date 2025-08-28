const mongoose = require('mongoose');

const rentalHistorySchema = new mongoose.Schema({
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
  machine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  rented_on: {
    type: Date,
    required: true,
    default: Date.now
  },
  returned_on: {
    type: Date,
    default: null
  },
  return_condition: {
    type: String,
    enum: ['good', 'damaged', 'broken'],
    default: null
  },
  // Additional rental details
  rental_amount: {
    type: Number,
    required: true,
    min: 0
  },
  security_deposit: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'overdue'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
rentalHistorySchema.index({ dealerId: 1, customer_id: 1 });
rentalHistorySchema.index({ dealerId: 1, machine_id: 1 });
rentalHistorySchema.index({ dealerId: 1, status: 1 });

module.exports = mongoose.model('RentalHistory', rentalHistorySchema);