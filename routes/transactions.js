// ============================================
// routes/transactions.js - GCash Transactions
// ============================================
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Request = require('../models/Request');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   POST /api/transactions
// @desc    Record GCash donation
router.post('/', protect, async (req, res) => {
  try {
    const { requestId, amount, gcashReference, notes } = req.body;

    if (amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum donation is ₱10'
      });
    }

    const request = await Request.findById(requestId);

    if (!request || request.type !== 'money') {
      return res.status(404).json({
        success: false,
        message: 'Invalid money request'
      });
    }

    // Calculate fees
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT) || 5;
    const platformFee = amount * (platformFeePercent / 100);
    const netAmount = amount - platformFee;

    // Create transaction
    const transaction = await Transaction.create({
      donor: req.user._id,
      request: requestId,
      amount,
      platformFee,
      netAmount,
      gcashReference,
      status: 'completed',
      notes
    });

    // Update request
    request.amountReceived += netAmount;
    await request.save();

    // Update donor stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalDonated: amount }
    });

    // Notify requester
    await Notification.create({
      user: request.requester,
      type: 'donation_received',
      message: `${req.user.name} donated ₱${amount.toLocaleString()}`,
      relatedRequest: request._id
    });

    await transaction.populate([
      { path: 'donor', select: 'name' },
      { path: 'request', select: 'title type' }
    ]);

    res.status(201).json({
      success: true,
      data: transaction,
      message: `₱${netAmount.toFixed(2)} sent to recipient. ₱${platformFee.toFixed(2)} platform fee to ${process.env.GCASH_OWNER_NUMBER}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/transactions/my-donations
// @desc    Get user's donations
router.get('/my-donations', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ donor: req.user._id })
      .populate('request', 'title type requester')
      .populate('request.requester', 'name')
      .sort('-createdAt');

    const total = await Transaction.aggregate([
      { $match: { donor: req.user._id, status: 'completed' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      count: transactions.length,
      total: total[0] || { totalAmount: 0, count: 0 },
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/transactions/request/:requestId
// @desc    Get donations for a request
router.get('/request/:requestId', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      request: req.params.requestId,
      status: 'completed'
    })
      .populate('donor', 'name userType')
      .sort('-createdAt');

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/transactions/my-transactions
// @desc    Get all transactions for logged-in donor
router.get('/my-transactions', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ donor: req.user._id })
      .populate('request', 'title type requester')
      .populate('request.requester', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/transactions/stats
// @desc    Get donor transaction statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const total = await Transaction.countDocuments({ donor: req.user._id });
    const totalAmount = await Transaction.aggregate([
      { $match: { donor: req.user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      totalTransactions: total,
      totalAmount: totalAmount[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/transactions/unread-count
// @desc    Get count of unread notifications for the logged-in user
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

module.exports = router;
