// ============================================
// routes/users.js
// ============================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/users/leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    let query = { isActive: true };
    if (type !== 'all') query.userType = type;

    const users = await User.find(query)
      .select('name userType totalHelps totalDonated badges')
      .sort('-totalDonated -totalHelps')
      .limit(100);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      name: user.name,
      userType: user.userType,
      totalHelps: user.totalHelps,
      totalDonated: user.totalDonated,
      badges: user.badges
    }));

    res.json({
      success: true,
      data: leaderboard
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