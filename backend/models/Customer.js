const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  contact_number: {
    type: String,
    required: [true, 'Contact number is required']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  business_type: {
    type: String,
    required: true,
    enum: ['Construction', 'Landscaping', 'Agriculture', 'Mining', 'Transportation', 'Other']
  },
  // Computed fields for quick access
  total_rentals: {
    type: Number,
    default: 0
  },
  total_outstanding_due: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for dealer-specific customer queries
customerSchema.index({ dealerId: 1, name: 1 });
customerSchema.index({ dealerId: 1, email: 1 });

module.exports = mongoose.model('Customer', customerSchema);