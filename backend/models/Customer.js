const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  businessType: {
    type: String,
    required: true,
    enum: ['Construction', 'Landscaping', 'Agriculture', 'Mining', 'Transportation', 'Other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  contactPerson: {
    name: String,
    title: String,
    phone: String,
    email: String
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  totalRentals: {
    type: Number,
    default: 0
  },
  rentalHistory: [{
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental' },
    startDate: Date,
    endDate: Date,
    returnCondition: { type: String, enum: ['Good', 'Damaged', 'Broken'] },
    totalAmount: Number,
    paidAmount: Number,
    createdAt: { type: Date, default: Date.now }
  }],
  frequentlyRentedMachines: [{
    vehicleType: String,
    count: Number,
    lastRented: Date
  }],
  usagePatterns: {
    peakMonths: [String],
    averageRentalDuration: Number,
    preferredVehicleTypes: [String]
  },
  paymentHistory: [{
    amount: Number,
    date: Date,
    method: String,
    reference: String
  }],
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for dealer-specific customer queries
customerSchema.index({ dealerId: 1, customerId: 1 });
customerSchema.index({ dealerId: 1, name: 1 });
customerSchema.index({ dealerId: 1, email: 1 });

module.exports = mongoose.model('Customer', customerSchema);