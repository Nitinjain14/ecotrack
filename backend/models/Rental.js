const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
    index: true
  },
  rentalId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  expectedEndDate: {
    type: Date,
    required: true
  },
  actualEndDate: Date,
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Overdue', 'Cancelled'],
    default: 'Active'
  },
  rentalType: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Custom'],
    required: true
  },
  rates: {
    dailyRate: Number,
    weeklyRate: Number,
    monthlyRate: Number,
    customRate: Number
  },
  totalAmount: {
    type: Number,
    required: true
  },
  securityDeposit: {
    type: Number,
    default: 0
  },
  additionalCharges: [{
    description: String,
    amount: Number,
    date: Date
  }],
  discounts: [{
    description: String,
    amount: Number,
    percentage: Number
  }],
  pickupLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  deliveryLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  pickupCondition: {
    condition: { type: String, enum: ['Good', 'Fair', 'Damaged'] },
    notes: String,
    images: [String],
    checkedBy: String,
    checkDate: Date
  },
  returnCondition: {
    condition: { type: String, enum: ['Good', 'Fair', 'Damaged'] },
    notes: String,
    images: [String],
    checkedBy: String,
    checkDate: Date,
    damageCharges: Number
  },
  operatorRequired: {
    type: Boolean,
    default: false
  },
  operatorDetails: {
    name: String,
    license: String,
    hourlyRate: Number
  },
  fuelPolicy: {
    type: String,
    enum: ['Full-to-Full', 'Same-to-Same', 'Included'],
    default: 'Same-to-Same'
  },
  mileage: {
    start: Number,
    end: Number,
    limit: Number,
    overageRate: Number
  },
  insurance: {
    required: { type: Boolean, default: true },
    provider: String,
    policyNumber: String,
    coverage: Number
  },
  terms: {
    cancellationPolicy: String,
    lateFees: Number,
    extensionPolicy: String
  },
  notes: String,
  documents: [{
    type: String,
    url: String,
    uploadDate: Date
  }]
}, {
  timestamps: true
});

// Compound indexes for efficient queries
rentalSchema.index({ dealerId: 1, status: 1 });
rentalSchema.index({ dealerId: 1, customerId: 1 });
rentalSchema.index({ dealerId: 1, vehicleId: 1 });
rentalSchema.index({ dealerId: 1, startDate: 1 });
rentalSchema.index({ dealerId: 1, expectedEndDate: 1 });

module.exports = mongoose.model('Rental', rentalSchema);