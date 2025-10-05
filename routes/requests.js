// routes/requests.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { sendEmailToAll } = require('../utils/email');

// @route   POST /api/requests
router.post('/', protect, async (req, res) => {
  try {
    let { type, title, description, lat, lng, address, gcashNumber, amountNeeded } = req.body;

    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required.'
      });
    }

    const request = await Request.create({
      requester: req.user._id,
      type,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      },
      address,
      gcashNumber: type === 'money' ? gcashNumber : undefined,
      amountNeeded: type === 'money' ? amountNeeded : undefined
    });

    await request.populate('requester', 'name email phone');

    // Notify all active users except requester
    const allUsers = await User.find({ _id: { $ne: req.user._id }, isActive: true });
    const notifications = allUsers.map(user => ({
      user: user._id,
      type: 'new_request',
      message: `New ${type} request from ${req.user.name}`,
      relatedRequest: request._id
    }));

    if (notifications.length) await Notification.insertMany(notifications);

    // Send email to all
    await sendEmailToAll(request);

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
router.get('/', protect, async (req, res) => {
  try {
    const { type, status } = req.query;

    let query = { isActive: true };
    if (type && type !== 'all') query.type = type;
    if (status) query.status = status;

    const requests = await Request.find(query)
      .populate('requester', 'name phone userType')
      .populate('volunteer', 'name phone')
      .sort('-createdAt')
      .limit(100);

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/requests/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requester', 'name email phone userType')
      .populate('volunteer', 'name phone');

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
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'pending') {
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

    request.status = 'in-progress';
    request.volunteer = req.user._id;
    request.acceptedAt = Date.now();
    await request.save();

    await Notification.create({
      user: request.requester,
      type: 'request_accepted',
      message: `${req.user.name} accepted your ${request.type} request`,
      relatedRequest: request._id
    });

    await request.populate(['requester', 'volunteer']);

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

// @route   POST /api/requests/:id/mark-complete
router.post('/:id/mark-complete', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.volunteer?.toString() !== req.user._id.toString()) {
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

    await request.populate(['requester', 'volunteer']);

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

    await User.findByIdAndUpdate(request.volunteer, {
      $inc: { totalHelps: 1 }
    });

    await request.populate(['requester', 'volunteer']);

    res.json({
      success: true,
      message: 'Request completed successfully!',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/requests/my-requests
// @desc    Get requests created by the logged-in user
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .populate('requester', 'name phone')
      .sort('-createdAt');

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error in /my-requests:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// @route   GET /api/requests/accepted
router.get('/accepted', protect, async (req, res) => {
  try {
    const requests = await Request.find({
      volunteer: req.user._id,
      status: { $in: ['in-progress', 'completed'] }
    })
    .populate('requester', 'name phone')
    .sort('-createdAt');

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;