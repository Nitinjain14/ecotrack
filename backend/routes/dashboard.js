const express = require('express');
const moment = require('moment');
const { protect, ensureDataIsolation } = require('../middlewares/auth');
const Machine = require('../models/Machine');
const Customer = require('../models/Customer');
const RentalHistory = require('../models/RentalHistory');
const PaymentRecord = require('../models/PaymentRecord');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', protect, ensureDataIsolation, async (req, res) => {
  try {
    const dealerId = req.dealerId;

    // Get machine statistics
    const machineStats = await Machine.aggregate([
      { $match: { dealerId, isActive: true } },
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get rental statistics
    const rentalStats = await RentalHistory.aggregate([
      { $match: { dealerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get payment statistics
    const paymentStats = await PaymentRecord.aggregate([
      { $match: { dealerId } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalPaid: { $sum: '$amount_paid' },
          totalOutstanding: { $sum: '$outstanding_due' }
        }
      }
    ]);

    // Get customer count
    const customerCount = await Customer.countDocuments({ dealerId, isActive: true });

    // Format machine stats
    const machineStatusCounts = {
      total: 0,
      available: 0,
      rented: 0,
      reserved: 0,
      under_maintenance: 0
    };

    machineStats.forEach(stat => {
      machineStatusCounts.total += stat.count;
      switch (stat._id) {
        case 'available':
          machineStatusCounts.available = stat.count;
          break;
        case 'rented':
          machineStatusCounts.rented = stat.count;
          break;
        case 'reserved':
          machineStatusCounts.reserved = stat.count;
          break;
        case 'under_maintenance':
          machineStatusCounts.under_maintenance = stat.count;
          break;
      }
    });

    // Format rental stats
    const rentalStatusCounts = {
      active: 0,
      completed: 0,
      overdue: 0
    };

    rentalStats.forEach(stat => {
      switch (stat._id) {
        case 'active':
          rentalStatusCounts.active = stat.count;
          break;
        case 'completed':
          rentalStatusCounts.completed = stat.count;
          break;
        case 'overdue':
          rentalStatusCounts.overdue = stat.count;
          break;
      }
    });

    // Format payment stats
    const paymentStatusCounts = {
      totalPaid: paymentStats[0]?.totalPaid || 0,
      totalOutstanding: paymentStats[0]?.totalOutstanding || 0,
      totalPayments: paymentStats[0]?.count || 0
    };

    res.json({
      success: true,
      data: {
        machines: machineStatusCounts,
        rentals: rentalStatusCounts,
        payments: paymentStatusCounts,
        customers: customerCount,
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
    const recentRentals = await RentalHistory.find({ dealerId })
      .populate('customer_id', 'name')
      .populate('machine_id', 'machine_name machine_type')
      .sort({ rented_on: -1 })
      .limit(limit);

    // Get recent payments
    const recentPayments = await PaymentRecord.find({ dealerId })
      .populate('customer_id', 'name')
      .populate('rental_id', 'rented_on')
      .sort({ payment_date: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: {
        rentals: recentRentals,
        payments: recentPayments
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
        groupBy = { $dateToString: { format: "%Y-%m", date: "$payment_date" } };
        break;
      case 'quarter':
        startDate = moment().subtract(3, 'months').startOf('month');
        groupBy = { $dateToString: { format: "%Y-%m", date: "$payment_date" } };
        break;
      default:
        startDate = moment().subtract(30, 'days').startOf('day');
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$payment_date" } };
    }

    const revenueData = await PaymentRecord.aggregate([
      {
        $match: {
          dealerId,
          payment_date: { $gte: startDate.toDate() }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$amount_paid' },
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