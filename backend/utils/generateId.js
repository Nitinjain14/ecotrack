const crypto = require('crypto');

// Generate unique IDs for different entities
exports.generateCustomerId = (dealerId) => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const dealerPrefix = dealerId.toString().slice(-4).toUpperCase();
  return `CUS-${dealerPrefix}-${timestamp}-${random}`;
};

exports.generateVehicleId = (dealerId, type) => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  const dealerPrefix = dealerId.toString().slice(-4).toUpperCase();
  const typePrefix = type.substring(0, 3).toUpperCase();
  return `${typePrefix}-${dealerPrefix}-${timestamp}-${random}`;
};

exports.generateRentalId = (dealerId) => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const dealerPrefix = dealerId.toString().slice(-4).toUpperCase();
  return `RNT-${dealerPrefix}-${timestamp}-${random}`;
};

exports.generatePaymentId = (dealerId) => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  const dealerPrefix = dealerId.toString().slice(-4).toUpperCase();
  return `PAY-${dealerPrefix}-${timestamp}-${random}`;
};

exports.generateAlertId = (dealerId) => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  const dealerPrefix = dealerId.toString().slice(-4).toUpperCase();
  return `ALT-${dealerPrefix}-${timestamp}-${random}`;
};