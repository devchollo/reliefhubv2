// ============================================
// routes/users.js
// ============================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/users/leaderboard
// In routes/users.js, update the leaderboard route:
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { filter = 'all', timeframe = 'all-time' } = req.query;

    let query = { isActive: true };
    if (filter !== 'all') {
      if (filter === 'donors') query['stats.totalDonated'] = { $gt: 0 };
      else if (filter === 'volunteers') query['stats.totalHelped'] = { $gt: 0 };
      else if (filter === 'organizations') query.userType = 'organization';
    }

    const users = await User.find(query)
      .select('name userType stats badges')
      .sort('-stats.points -stats.totalHelped -stats.totalDonated')
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/users/me/stats
router.get('/me/stats', protect, async (req, res) => {
  try {
    const allUsers = await User.find({ isActive: true })
      .select('_id totalDonated')
      .sort('-totalDonated');

    const rank = allUsers.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;

    res.json({
      success: true,
      data: {
        rank,
        totalUsers: allUsers.length,
        percentile: Math.round((1 - (rank / allUsers.length)) * 100),
        totalHelps: req.user.totalHelps,
        totalDonated: req.user.totalDonated,
        badges: req.user.badges
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;