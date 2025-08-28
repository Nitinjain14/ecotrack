const express = require('express');
const moment = require('moment');
const { protect, ensureDataIsolation } = require('../middlewares/auth');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const Payment = require('../models/Payment');
const Alert = require('../models/Alert');
const { generateAllAlerts } = require('../utils/alertGenerator');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', protect, ensureDataIsolation, async (req, res) => {
  try {
    const dealerId = req.dealerId;

    // Generate alerts before fetching stats
    await generateAllAlerts(dealerId);

    // Get vehicle statistics
    const vehicleStats = await Vehicle.aggregate([
      { $match: { dealerId, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get rental statistics
    const rentalStats = await Rental.aggregate([
      { $match: { dealerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get payment statistics
    const paymentStats = await Payment.aggregate([
      { $match: { dealerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get customer count
    const customerCount = await Customer.countDocuments({ dealerId, isActive: true });

    // Get active alerts count
    const alertCount = await Alert.countDocuments({ 
      dealerId, 
      status: 'Active' 
    });

    // Format vehicle stats
    const vehicleStatusCounts = {
      total: 0,
      available: 0,
      rented: 0,
      reserved: 0,
      maintenance: 0,
      outOfService: 0
    };

    vehicleStats.forEach(stat => {
      vehicleStatusCounts.total += stat.count;
      switch (stat._id) {
        case 'Available':
          vehicleStatusCounts.available = stat.count;
          break;
        case 'Rented':
          vehicleStatusCounts.rented = stat.count;
          break;
        case 'Reserved':
          vehicleStatusCounts.reserved = stat.count;
          break;
        case 'Under Maintenance':
          vehicleStatusCounts.maintenance = stat.count;
          break;
        case 'Out of Service':
          vehicleStatusCounts.outOfService = stat.count;
          break;
      }
    });

    // Format rental stats
    const rentalStatusCounts = {
      active: 0,
      completed: 0,
      overdue: 0,
      cancelled: 0
    };

    rentalStats.forEach(stat => {
      switch (stat._id) {
        case 'Active':
          rentalStatusCounts.active = stat.count;
          break;
        case 'Completed':
          rentalStatusCounts.completed = stat.count;
          break;
        case 'Overdue':
          rentalStatusCounts.overdue = stat.count;
          break;
        case 'Cancelled':
          rentalStatusCounts.cancelled = stat.count;
          break;
      }
    });

    // Format payment stats
    const paymentStatusCounts = {
      totalRevenue: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0
    };

    paymentStats.forEach(stat => {
      switch (stat._id) {
        case 'Completed':
          paymentStatusCounts.totalRevenue = stat.totalAmount || 0;
          paymentStatusCounts.paidCount = stat.count;
          break;
        case 'Pending':
          paymentStatusCounts.pendingAmount = stat.totalAmount || 0;
          paymentStatusCounts.pendingCount = stat.count;
          break;
        case 'Partially Paid':
          paymentStatusCounts.overdueAmount += stat.totalAmount || 0;
          paymentStatusCounts.overdueCount += stat.count;
          break;
      }
    });

    res.json({
      success: true,
      data: {
        vehicles: vehicleStatusCounts,
        rentals: rentalStatusCounts,
        payments: paymentStatusCounts,
        customers: customerCount,
        alerts: alertCount,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity
// @access  Private
router.get('/recent-activity', protect, ensureDataIsolation, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent rentals
    const recentRentals = await Rental.find({ dealerId })
      .populate('customerId', 'name')
      .populate('vehicleId', 'vehicleId type')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Get recent payments
    const recentPayments = await Payment.find({ dealerId })
      .populate('customerId', 'name')
      .populate('rentalId', 'rentalId')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Get recent alerts
    const recentAlerts = await Alert.find({ dealerId, status: 'Active' })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: {
        rentals: recentRentals,
        payments: recentPayments,
        alerts: recentAlerts
      }
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity'
    });
  }
});

// @route   GET /api/dashboard/revenue-chart
// @desc    Get revenue chart data
// @access  Private
router.get('/revenue-chart', protect, ensureDataIsolation, async (req, res) => {
  try {
    const dealerId = req.dealerId;
    const period = req.query.period || 'month'; // month, quarter, year
    
    let startDate, groupBy;
    
    switch (period) {
      case 'year':
        startDate = moment().subtract(12, 'months').startOf('month');
        groupBy = { $dateToString: { format: "%Y-%m", date: "$paidDate" } };
        break;
      case 'quarter':
        startDate = moment().subtract(3, 'months').startOf('month');
        groupBy = { $dateToString: { format: "%Y-%m", date: "$paidDate" } };
        break;
      default:
        startDate = moment().subtract(30, 'days').startOf('day');
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$paidDate" } };
    }

    const revenueData = await Payment.aggregate([
      {
        $match: {
          dealerId,
          status: 'Completed',
          paidDate: { $gte: startDate.toDate() }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Revenue chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue chart data'
    });
  }
});

module.exports = router;