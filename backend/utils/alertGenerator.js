const moment = require('moment');
const Alert = require('../models/Alert');
const Rental = require('../models/Rental');
const Payment = require('../models/Payment');
const Vehicle = require('../models/Vehicle');
const { generateAlertId } = require('./generateId');

// Generate overdue rental alerts
exports.generateOverdueRentalAlerts = async (dealerId) => {
  try {
    const overdueRentals = await Rental.find({
      dealerId,
      status: 'Active',
      expectedEndDate: { $lt: new Date() }
    }).populate('customerId vehicleId');

    const alerts = [];
    
    for (const rental of overdueRentals) {
      const existingAlert = await Alert.findOne({
        dealerId,
        type: 'Overdue Rental',
        'relatedEntity.entityId': rental._id,
        status: 'Active'
      });

      if (!existingAlert) {
        const daysOverdue = moment().diff(moment(rental.expectedEndDate), 'days');
        
        const alert = new Alert({
          dealerId,
          alertId: generateAlertId(dealerId),
          type: 'Overdue Rental',
          priority: daysOverdue > 7 ? 'Critical' : daysOverdue > 3 ? 'High' : 'Medium',
          title: `Overdue Rental - ${rental.vehicleId.vehicleId}`,
          message: `Rental ${rental.rentalId} is ${daysOverdue} days overdue. Customer: ${rental.customerId.name}`,
          relatedEntity: {
            entityType: 'Rental',
            entityId: rental._id,
            entityName: rental.rentalId
          },
          dueDate: new Date()
        });

        alerts.push(alert);
      }
    }

    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
    }

    return alerts.length;
  } catch (error) {
    console.error('Error generating overdue rental alerts:', error);
    throw error;
  }
};

// Generate overdue payment alerts
exports.generateOverduePaymentAlerts = async (dealerId) => {
  try {
    const overduePayments = await Payment.find({
      dealerId,
      status: { $in: ['Pending', 'Partially Paid'] },
      dueDate: { $lt: new Date() }
    }).populate('customerId rentalId');

    const alerts = [];
    
    for (const payment of overduePayments) {
      const existingAlert = await Alert.findOne({
        dealerId,
        type: 'Overdue Payment',
        'relatedEntity.entityId': payment._id,
        status: 'Active'
      });

      if (!existingAlert) {
        const daysOverdue = moment().diff(moment(payment.dueDate), 'days');
        
        const alert = new Alert({
          dealerId,
          alertId: generateAlertId(dealerId),
          type: 'Overdue Payment',
          priority: daysOverdue > 30 ? 'Critical' : daysOverdue > 14 ? 'High' : 'Medium',
          title: `Overdue Payment - $${payment.amount}`,
          message: `Payment ${payment.paymentId} of $${payment.amount} is ${daysOverdue} days overdue. Customer: ${payment.customerId.name}`,
          relatedEntity: {
            entityType: 'Payment',
            entityId: payment._id,
            entityName: payment.paymentId
          },
          dueDate: new Date()
        });

        alerts.push(alert);
      }
    }

    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
    }

    return alerts.length;
  } catch (error) {
    console.error('Error generating overdue payment alerts:', error);
    throw error;
  }
};

// Generate maintenance due alerts
exports.generateMaintenanceAlerts = async (dealerId) => {
  try {
    const vehiclesDueMaintenance = await Vehicle.find({
      dealerId,
      'maintenanceSchedule.nextMaintenance': { 
        $lte: moment().add(7, 'days').toDate() 
      },
      isActive: true
    });

    const alerts = [];
    
    for (const vehicle of vehiclesDueMaintenance) {
      const existingAlert = await Alert.findOne({
        dealerId,
        type: 'Maintenance Due',
        'relatedEntity.entityId': vehicle._id,
        status: 'Active'
      });

      if (!existingAlert) {
        const daysUntilMaintenance = moment(vehicle.maintenanceSchedule.nextMaintenance).diff(moment(), 'days');
        
        const alert = new Alert({
          dealerId,
          alertId: generateAlertId(dealerId),
          type: 'Maintenance Due',
          priority: daysUntilMaintenance <= 0 ? 'Critical' : daysUntilMaintenance <= 3 ? 'High' : 'Medium',
          title: `Maintenance Due - ${vehicle.vehicleId}`,
          message: `${vehicle.type} ${vehicle.vehicleId} ${daysUntilMaintenance <= 0 ? 'is overdue for' : 'requires'} maintenance in ${Math.abs(daysUntilMaintenance)} days`,
          relatedEntity: {
            entityType: 'Vehicle',
            entityId: vehicle._id,
            entityName: vehicle.vehicleId
          },
          dueDate: vehicle.maintenanceSchedule.nextMaintenance
        });

        alerts.push(alert);
      }
    }

    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
    }

    return alerts.length;
  } catch (error) {
    console.error('Error generating maintenance alerts:', error);
    throw error;
  }
};

// Generate vehicle damage alerts
exports.generateVehicleDamageAlerts = async (dealerId, rentalId, damageDetails) => {
  try {
    const rental = await Rental.findById(rentalId).populate('customerId vehicleId');
    
    if (!rental) {
      throw new Error('Rental not found');
    }

    const alert = new Alert({
      dealerId,
      alertId: generateAlertId(dealerId),
      type: 'Vehicle Damage',
      priority: 'High',
      title: `Vehicle Damage Reported - ${rental.vehicleId.vehicleId}`,
      message: `${rental.vehicleId.type} ${rental.vehicleId.vehicleId} returned with damage. Customer: ${rental.customerId.name}. Details: ${damageDetails}`,
      relatedEntity: {
        entityType: 'Vehicle',
        entityId: rental.vehicleId._id,
        entityName: rental.vehicleId.vehicleId
      },
      dueDate: new Date()
    });

    await alert.save();
    return alert;
  } catch (error) {
    console.error('Error generating vehicle damage alert:', error);
    throw error;
  }
};

// Run all alert generators
exports.generateAllAlerts = async (dealerId) => {
  try {
    const results = await Promise.all([
      this.generateOverdueRentalAlerts(dealerId),
      this.generateOverduePaymentAlerts(dealerId),
      this.generateMaintenanceAlerts(dealerId)
    ]);

    return {
      overdueRentals: results[0],
      overduePayments: results[1],
      maintenanceDue: results[2],
      total: results.reduce((sum, count) => sum + count, 0)
    };
  } catch (error) {
    console.error('Error generating alerts:', error);
    throw error;
  }
};