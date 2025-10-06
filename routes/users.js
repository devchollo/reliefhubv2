// ============================================
// routes/users.js - FIXED VERSION
// ============================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Request = require('../models/Request');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

// @route   GET /api/users/leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { filter = 'all', timeframe = 'all-time' } = req.query;

    let query = { isActive: true };
    
    // Apply filters
    if (filter === 'donors') {
      query['stats.totalDonated'] = { $gt: 0 };
    } else if (filter === 'volunteers') {
      query['stats.totalHelped'] = { $gt: 0 };
    } else if (filter === 'organizations') {
      query.userType = 'organization';
    }

    // Get all users
    const users = await User.find(query)
      .select('name userType stats badges profileImage')
      .lean();

    // Calculate actual stats for each user
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      // Count completed requests where user was volunteer
      const completedAsVolunteer = await Request.countDocuments({
        volunteer: user._id,
        status: 'completed'
      });

      // Get reviews to calculate average rating
      const reviews = await Review.find({
        reviewee: user._id,
        isVisible: true
      }).select('rating');

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Calculate points
      // 10 points per completed request + 5 bonus for 5-star ratings
      const fiveStarReviews = reviews.filter(r => r.rating === 5).length;
      const points = (completedAsVolunteer * 10) + (fiveStarReviews * 5);

      return {
        _id: user._id,
        name: user.name,
        userType: user.userType,
        profileImage: user.profileImage,
        badges: user.badges || [],
        totalHelped: completedAsVolunteer,
        completedRequests: completedAsVolunteer,
        totalDonated: user.stats?.totalDonated || 0,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: reviews.length,
        points
      };
    }));

    // Sort by points, then by totalHelped, then by totalDonated
    enrichedUsers.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.totalHelped !== a.totalHelped) return b.totalHelped - a.totalHelped;
      return b.totalDonated - a.totalDonated;
    });

    // Update users with their stats and rank
    await Promise.all(enrichedUsers.map(async (userData, index) => {
      await User.findByIdAndUpdate(userData._id, {
        'stats.totalHelped': userData.totalHelped,
        'stats.completedRequests': userData.completedRequests,
        'stats.averageRating': userData.averageRating,
        'stats.totalReviews': userData.totalReviews,
        'stats.points': userData.points,
        'leaderboardRank': index + 1
      });
    }));

    res.json({
      success: true,
      count: enrichedUsers.length,
      data: enrichedUsers
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
});

// @route   GET /api/users/me/stats
router.get('/me/stats', protect, async (req, res) => {
  try {
    // Get actual completed count
    const completedAsVolunteer = await Request.countDocuments({
      volunteer: req.user._id,
      status: 'completed'
    });

    // Get reviews
    const reviews = await Review.find({
      reviewee: req.user._id,
      isVisible: true
    }).select('rating');

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Calculate points
    const fiveStarReviews = reviews.filter(r => r.rating === 5).length;
    const points = (completedAsVolunteer * 10) + (fiveStarReviews * 5);

    // Get all users and calculate rank
    const allUsers = await User.find({ isActive: true })
      .select('_id stats')
      .lean();

    // Calculate each user's points for ranking
    const userPoints = await Promise.all(allUsers.map(async (u) => {
      const completed = await Request.countDocuments({
        volunteer: u._id,
        status: 'completed'
      });
      const userReviews = await Review.find({
        reviewee: u._id,
        isVisible: true
      }).select('rating');
      const fiveStar = userReviews.filter(r => r.rating === 5).length;
      const pts = (completed * 10) + (fiveStar * 5);
      return { userId: u._id.toString(), points: pts, completed };
    }));

    userPoints.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.completed - a.completed;
    });

    const rank = userPoints.findIndex(u => u.userId === req.user._id.toString()) + 1;

    // Update user's stats
    await User.findByIdAndUpdate(req.user._id, {
      'stats.totalHelped': completedAsVolunteer,
      'stats.completedRequests': completedAsVolunteer,
      'stats.averageRating': parseFloat(avgRating.toFixed(1)),
      'stats.totalReviews': reviews.length,
      'stats.points': points,
      'leaderboardRank': rank
    });

    res.json({
      success: true,
      data: {
        rank,
        totalUsers: allUsers.length,
        percentile: Math.round((1 - (rank / allUsers.length)) * 100),
        totalHelped: completedAsVolunteer,
        completedRequests: completedAsVolunteer,
        totalDonated: req.user.stats?.totalDonated || 0,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: reviews.length,
        points,
        badges: req.user.badges || []
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;