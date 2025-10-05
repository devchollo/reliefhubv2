// ============================================
// routes/transactions.js - FIXED VERSION
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
// @access  Private
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
// @access  Private
router.get('/my-donations', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ donor: req.user._id })
      .populate('request', 'title type requester')
      .populate({
        path: 'request',
        populate: { path: 'requester', select: 'name' }
      })
      .sort('-createdAt')
      .lean();

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
      message: error.message,
      data: []
    });
  }
});

// @route   GET /api/transactions/request/:requestId
// @desc    Get donations for a request
// @access  Private
router.get('/request/:requestId', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      request: req.params.requestId,
      status: 'completed'
    })
      .populate('donor', 'name userType')
      .sort('-createdAt')
      .lean();

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
});

// @route   GET /api/transactions/my-transactions
// @desc    Get all transactions for logged-in user (as donor or recipient)
// @access  Private
router.get('/my-transactions', protect, async (req, res) => {
  try {
    // Get transactions where user is the donor
    const donorTransactions = await Transaction.find({ donor: req.user._id })
      .populate('request', 'title type requester')
      .populate({
        path: 'request',
        populate: { path: 'requester', select: 'name' }
      })
      .sort('-createdAt')
      .lean();

    // Get transactions where user is the recipient (through their requests)
    const userRequests = await Request.find({ 
      requester: req.user._id,
      type: 'money'
    }).select('_id');

    const requestIds = userRequests.map(r => r._id);

    const recipientTransactions = await Transaction.find({ 
      request: { $in: requestIds }
    })
      .populate('donor', 'name userType')
      .populate('request', 'title type')
      .sort('-createdAt')
      .lean();

    // Combine and deduplicate
    const allTransactions = [...donorTransactions, ...recipientTransactions];
    
    // Remove duplicates based on _id
    const uniqueTransactions = allTransactions.filter((transaction, index, self) =>
      index === self.findIndex((t) => t._id.toString() === transaction._id.toString())
    );

    res.json({
      success: true,
      count: uniqueTransactions.length,
      data: uniqueTransactions
    });
  } catch (error) {
    console.error('Error fetching my-transactions:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
});

// @route   GET /api/transactions/stats
// @desc    Get user transaction statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // Get total transactions as donor
    const donorStats = await Transaction.aggregate([
      { $match: { donor: req.user._id, status: 'completed' } },
      { $group: { 
        _id: null, 
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' } 
      }}
    ]);

    // Get total transactions as recipient
    const userRequests = await Request.find({ 
      requester: req.user._id,
      type: 'money'
    }).select('_id');

    const requestIds = userRequests.map(r => r._id);

    const recipientStats = await Transaction.aggregate([
      { $match: { request: { $in: requestIds }, status: 'completed' } },
      { $group: { 
        _id: null, 
        totalReceived: { $sum: '$netAmount' },
        totalDonations: { $sum: 1 }
      }}
    ]);

    res.json({
      success: true,
      data: {
        totalTransactions: donorStats[0]?.totalTransactions || 0,
        totalDonated: donorStats[0]?.totalAmount || 0,
        totalReceived: recipientStats[0]?.totalReceived || 0,
        totalDonationsReceived: recipientStats[0]?.totalDonations || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: {
        totalTransactions: 0,
        totalDonated: 0,
        totalReceived: 0,
        totalDonationsReceived: 0
      }
    });
  }
});

// @route   POST /api/transactions/:id/confirm
// @desc    Confirm delivery (recipient confirms transaction)
// @access  Private
router.post('/:id/confirm', protect, async (req, res) => {
  try {
    const { receivedAt, notes } = req.body;

    const transaction = await Transaction.findById(req.params.id)
      .populate('request', 'requester');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user is the recipient
    if (transaction.request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient can confirm this transaction'
      });
    }

    transaction.confirmedAt = receivedAt || Date.now();
    transaction.notes = notes || transaction.notes;
    await transaction.save();

    res.json({
      success: true,
      message: 'Delivery confirmed successfully',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/transactions/:id/rate
// @desc    Rate a transaction
// @access  Private
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const transaction = await Transaction.findById(req.params.id)
      .populate('request', 'requester')
      .populate('donor', 'name');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user is the recipient
    if (transaction.request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient can rate this transaction'
      });
    }

    transaction.rating = rating;
    transaction.feedback = feedback;
    await transaction.save();

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: transaction
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
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      count: 0
    });
  }
});

module.exports = router;