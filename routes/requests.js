// ============================================
// routes/requests.js - COMPLETE FIXED VERSION
// ============================================
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
// const { sendEmailToAll } = require('../utils/email'); -- TURNING THIS OFF FOR NOW

// Logging middleware
router.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`, req.user ? req.user._id : 'no user');
  next();
});

// @route   POST /api/requests
// @desc    Create new request
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { 
      type, title, description, lat, lng, address, 
      gcashNumber, amountNeeded, category, urgency, 
      quantity, barangay, city, items 
    } = req.body;

    // Validation
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required.'
      });
    }

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and type are required.'
      });
    }

    // Create request
    const request = await Request.create({
      requester: req.user._id,
      type,
      title,
      description,
      category: category || type,
      urgency: urgency || 'medium',
      quantity,
      items: items || [type],
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        barangay,
        city
      },
      address,
      status: 'open',
      gcashNumber: type === 'money' ? gcashNumber : undefined,
      amountNeeded: type === 'money' ? amountNeeded : undefined
    });

    await request.populate('requester', 'name email phone');

    // Notify all users
    const allUsers = await User.find({ 
      _id: { $ne: req.user._id }, 
      isActive: true 
    });

    const notifications = allUsers.map(user => ({
      user: user._id,
      type: 'new_request',
      message: `New ${type} request from ${req.user.name}`,
      relatedRequest: request._id
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Send emails (async, don't wait)
    // sendEmailToAll(request).catch(err => 
    //   console.error('Email send error:', err.message)
    // );

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/requests
// @desc    Get all requests with filters
// @access  Public (but should be protected in production)
router.get('/', async (req, res) => {
  try {
    const { type, status, urgency, category } = req.query;

    let query = { isActive: true };
    
    if (type && type !== 'all') query.type = type;
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (category) query.category = category;

    const requests = await Request.find(query)
      .populate('requester', 'name phone userType')
      .populate('volunteer', 'name phone')
      .populate('acceptedBy', 'name phone')
      .sort('-createdAt')
      .limit(100)
      .lean();

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
});

// @route   GET /api/requests/my-requests
// @desc    Get requests created by logged-in user
// @access  Private
router.get('/my-requests', protect, async (req, res) => {
  try {
    console.log('[my-requests] Fetching for user:', req.user._id);
    
    const requests = await Request.find({ requester: req.user._id })
      .populate('volunteer', 'name phone')
      .populate('acceptedBy', 'name phone')
      .sort('-createdAt')
      .lean();

    console.log('[my-requests] Found:', requests.length);

    res.json({
      success: true,
      count: requests.length,
      data: Array.isArray(requests) ? requests : []
    });
  } catch (error) {
    console.error('[my-requests] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
});

// @route   GET /api/requests/accepted
// @desc    Get requests accepted by logged-in user
// @access  Private
router.get('/accepted', protect, async (req, res) => {
  try {
    console.log('[accepted] Fetching for volunteer:', req.user._id);
    
    const requests = await Request.find({
      $or: [
        { volunteer: req.user._id },
        { acceptedBy: req.user._id }
      ],
      status: { $in: ['accepted', 'in-progress', 'completed'] }
    })
      .populate('requester', 'name phone')
      .sort('-acceptedAt')
      .lean();

    console.log('[accepted] Found:', requests.length);

    res.json({
      success: true,
      count: requests.length,
      data: Array.isArray(requests) ? requests : []
    });
  } catch (error) {
    console.error('[accepted] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
});

// @route   GET /api/requests/:id
// @desc    Get single request
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requester', 'name email phone userType')
      .populate('volunteer', 'name phone')
      .populate('acceptedBy', 'name phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/requests/:id/accept
// @desc    Accept a request
// @access  Private
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'open' && request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not available'
      });
    }

    if (request.requester.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot accept your own request'
      });
    }

    // Update request
    request.status = 'in-progress';
    request.volunteer = req.user._id;
    request.acceptedBy = req.user._id;
    request.acceptedAt = Date.now();
    await request.save();

    // Create notification
    await Notification.create({
      user: request.requester,
      type: 'request_accepted',
      message: `${req.user.name} accepted your ${request.type} request`,
      relatedRequest: request._id
    });

    await request.populate(['requester', 'volunteer', 'acceptedBy']);

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/requests/:id/complete
// @desc    Mark request as complete (by volunteer or requester)
// @access  Private
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is the volunteer or requester
    const isVolunteer = request.volunteer?.toString() === req.user._id.toString() || 
                       request.acceptedBy?.toString() === req.user._id.toString();
    const isRequester = request.requester.toString() === req.user._id.toString();

    if (!isVolunteer && !isRequester) {
      return res.status(403).json({
        success: false,
        message: 'Only the volunteer or requester can complete this request'
      });
    }

    // Update request
    request.status = 'completed';
    request.completedAt = Date.now();
    await request.save();

    // Update volunteer's help count if volunteer completed it
    if (isVolunteer && request.volunteer) {
      await User.findByIdAndUpdate(request.volunteer, {
        $inc: { totalHelps: 1 }
      });
    }

    // Create notification
    if (isVolunteer) {
      await Notification.create({
        user: request.requester,
        type: 'request_completed',
        message: `${req.user.name} completed your request`,
        relatedRequest: request._id
      });
    } else if (isRequester && request.volunteer) {
      await Notification.create({
        user: request.volunteer,
        type: 'request_completed',
        message: `${req.user.name} confirmed completion of the request`,
        relatedRequest: request._id
      });
    }

    await request.populate(['requester', 'volunteer', 'acceptedBy']);

    res.json({
      success: true,
      message: 'Request marked as completed',
      data: request
    });
  } catch (error) {
    console.error('Error completing request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/requests/:id/mark-complete
// @desc    Mark request as complete (by volunteer) - waiting for confirmation
// @access  Private
router.post('/:id/mark-complete', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    const isVolunteer = request.volunteer?.toString() === req.user._id.toString() || 
                       request.acceptedBy?.toString() === req.user._id.toString();

    if (!isVolunteer) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned volunteer can mark as complete'
      });
    }

    request.markedCompleteAt = Date.now();
    await request.save();

    await Notification.create({
      user: request.requester,
      type: 'request_completed',
      message: `${req.user.name} marked your request as complete. Please confirm.`,
      relatedRequest: request._id
    });

    await request.populate(['requester', 'volunteer', 'acceptedBy']);

    res.json({
      success: true,
      message: 'Marked as complete. Waiting for requester confirmation.',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/requests/:id/confirm-complete
// @desc    Confirm request completion (by requester)
// @access  Private
router.post('/:id/confirm-complete', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the requester can confirm completion'
      });
    }

    if (!request.markedCompleteAt) {
      return res.status(400).json({
        success: false,
        message: 'Request has not been marked complete by volunteer'
      });
    }

    request.status = 'completed';
    request.completedAt = Date.now();
    await request.save();

    // Update volunteer's stats and award points
    if (request.volunteer) {
      const volunteer = await User.findById(request.volunteer);
      
      // Award base points (10 per completion)
      const basePoints = 10;
      
      // Extra points for urgency
      const urgencyBonus = request.urgency === 'critical' ? 15 : 
                          request.urgency === 'high' ? 10 : 
                          request.urgency === 'medium' ? 5 : 0;
      
      const totalPoints = basePoints + urgencyBonus;

      await User.findByIdAndUpdate(request.volunteer, {
        $inc: { 
          'stats.totalHelped': 1,
          'stats.completedRequests': 1,
          'stats.points': totalPoints,
          totalHelps: 1  // Legacy field
        }
      });

      // Award badges
      const completedCount = await Request.countDocuments({
        volunteer: request.volunteer,
        status: 'completed'
      });

      const newBadges = [];
      if (completedCount === 1) {
        newBadges.push({ name: 'First Help', type: 'milestone', earnedAt: new Date() });
      }
      if (completedCount === 10) {
        newBadges.push({ name: 'Helper', type: 'milestone', earnedAt: new Date() });
      }
      if (completedCount === 50) {
        newBadges.push({ name: 'Super Helper', type: 'milestone', earnedAt: new Date() });
      }
      if (completedCount === 100) {
        newBadges.push({ name: 'Relief Champion', type: 'milestone', earnedAt: new Date() });
      }

      if (newBadges.length > 0) {
        await User.findByIdAndUpdate(request.volunteer, {
          $push: { badges: { $each: newBadges } }
        });
      }
    }

    // Notify volunteer
    await Notification.create({
      user: request.volunteer,
      type: 'request_completed',
      message: `${req.user.name} confirmed completion! You earned points!`,
      relatedRequest: request._id
    });

    await request.populate(['requester', 'volunteer', 'acceptedBy']);

    res.json({
      success: true,
      message: 'Request completed successfully!',
      data: request
    });
  } catch (error) {
    console.error('Error confirming completion:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/requests/:id
// @desc    Update request
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is the requester
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    // Don't allow updates if request is completed
    if (request.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed request'
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        request[key] = updates[key];
      }
    });

    await request.save();
    await request.populate(['requester', 'volunteer', 'acceptedBy']);

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/requests/:id
// @desc    Delete/cancel request
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is the requester
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this request'
      });
    }

    // Soft delete - just mark as cancelled
    request.status = 'cancelled';
    request.isActive = false;
    await request.save();

    res.json({
      success: true,
      message: 'Request cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;