const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
    index: true
  },
  machine_name: {
    type: String,
    required: true,
    trim: true
  },
  machine_type: {
    type: String,
    required: true,
    enum: ['Bulldozer', 'Excavator', 'Loader', 'Crane', 'Grader', 'Dump Truck', 'Forklift', 'Backhoe', 'Skid Steer', 'Other']
  },
  model: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    enum: ['available', 'reserved', 'rented', 'under_maintenance'],
    default: 'available'
  },
  expected_return_date: {
    type: Date,
    default: null
  },
  // Additional fields for better tracking
  serial_number: {
    type: String,
    unique: true,
    sparse: true
  },
  year: {
    type: Number,
    min: 1990,
    max: new Date().getFullYear() + 1
  },
  daily_rate: {
    type: Number,
    required: true,
    min: 0
  },
  current_rental_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalHistory',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
machineSchema.index({ dealerId: 1, condition: 1 });
machineSchema.index({ dealerId: 1, machine_type: 1 });

module.exports = mongoose.model('Machine', machineSchema);