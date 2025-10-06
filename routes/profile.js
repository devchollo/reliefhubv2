// ============================================
// routes/profile.js - Profile & Review Routes
// ============================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Review = require('../models/Review');
const Request = require('../models/Request');
const { protect } = require('../middleware/auth');

// @route   GET /api/profile/:userId
// @desc    Get user profile with stats and reviews
// @access  Private
router.get('/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get reviews for this user
    const reviews = await Review.find({
      reviewee: req.params.userId,
      isVisible: true
    })
      .populate('reviewer', 'name profileImage userType')
      .populate('request', 'title type')
      .sort('-createdAt')
      .limit(20)
      .lean();

    // Calculate stats
    const completedAsVolunteer = await Request.countDocuments({
      volunteer: req.params.userId,
      status: 'completed'
    });

    const completedAsRequester = await Request.countDocuments({
      requester: req.params.userId,
      status: 'completed'
    });

    const totalHelped = completedAsVolunteer;

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Calculate leaderboard rank
    const allUsers = await User.find({ isActive: true })
      .select('_id')
      .sort('-stats.totalHelped -stats.totalDonated');

    const rank = allUsers.findIndex(u => u._id.toString() === req.params.userId) + 1;

    // Prepare response
    const profile = {
      ...user,
      stats: {
        ...user.stats,
        totalHelped,
        completedRequests: completedAsVolunteer,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: reviews.length
      },
      leaderboardRank: rank,
      reviews
    };

    // Filter contact info based on privacy settings
    if (req.user._id.toString() !== req.params.userId) {
      if (!user.publicProfile?.showEmail) delete profile.email;
      if (!user.publicProfile?.showPhone) delete profile.phone;
      if (!user.publicProfile?.showAddress) delete profile.address;
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/profile/update
// @desc    Update user profile
// @access  Private
router.put('/update', protect, async (req, res) => {
  try {
    const {
      name,
      phone,
      bio,
      profileImage,
      address,
      publicProfile
    } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone) {
      // Validate phone format
      if (!/^\+63\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Phone must be in format +639XXXXXXXXX'
        });
      }
      updates.phone = phone;
    }
    if (bio !== undefined) updates.bio = bio;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (address) updates.address = address;
    if (publicProfile) updates.publicProfile = publicProfile;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/profile/reviews
// @desc    Create a review
// @access  Private
router.post('/reviews', protect, async (req, res) => {
  try {
    const { revieweeId, requestId, rating, comment } = req.body;

    if (!revieweeId || !requestId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'RevieweeId, requestId, and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if request exists and is completed
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed requests'
      });
    }

    // Check if user is authorized to review (must be requester)
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the requester can leave a review'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      reviewer: req.user._id,
      request: requestId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this request'
      });
    }

    // Create review
    const review = await Review.create({
      reviewer: req.user._id,
      reviewee: revieweeId,
      request: requestId,
      rating,
      comment
    });

    // Update reviewee's average rating and points
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await User.findByIdAndUpdate(revieweeId, {
      'stats.averageRating': parseFloat(avgRating.toFixed(1)),
      'stats.totalReviews': allReviews.length,
      $inc: {
        'stats.points': rating === 5 ? 5 : 0 // Bonus points for 5-star ratings
      }
    });

    await review.populate([
      { path: 'reviewer', select: 'name profileImage userType' },
      { path: 'request', select: 'title type' }
    ]);

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/profile/:userId/reviews
// @desc    Get reviews for a user
// @access  Private
router.get('/:userId/reviews', protect, async (req, res) => {
  try {
    const reviews = await Review.find({
      reviewee: req.params.userId,
      isVisible: true
    })
      .populate('reviewer', 'name profileImage userType')
      .populate('request', 'title type')
      .sort('-createdAt')
      .lean();

    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
});

module.exports = router;