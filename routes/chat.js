// ============================================
// routes/chat.js - Chat API Routes
// ============================================
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Request = require('../models/Request');
const { protect } = require('../middleware/auth');
const getIO = (req) => req.app.get('io');

// @route   GET /api/chats
// @desc    Get all chats for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive: true
    })
      .populate('requester', 'name profileImage phone')
      .populate('volunteer', 'name profileImage phone')
      .populate('request', 'title type status')
      .populate('lastMessage.sender', 'name')
      .sort('-lastMessage.createdAt')
      .lean();

    res.json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
});

// @route   GET /api/chats/request/:requestId
// @desc    Get or create chat for a specific request
// @access  Private
router.get('/request/:requestId', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
      .populate('requester', 'name profileImage phone')
      .populate('volunteer', 'name profileImage phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is part of this request
    const isRequester = request.requester._id.toString() === req.user._id.toString();
    const isVolunteer = request.volunteer?._id.toString() === req.user._id.toString();

    if (!isRequester && !isVolunteer) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this chat'
      });
    }

    // Find existing chat or create new one
    let chat = await Chat.findOne({
      request: req.params.requestId
    })
      .populate('requester', 'name profileImage phone')
      .populate('volunteer', 'name profileImage phone')
      .populate('request', 'title type status')
      .populate('messages.sender', 'name profileImage');

    if (!chat && request.volunteer) {
      // Create new chat
      chat = await Chat.create({
        request: request._id,
        requester: request.requester._id,
        volunteer: request.volunteer._id,
        participants: [request.requester._id, request.volunteer._id],
        messages: []
      });

      await chat.populate([
        { path: 'requester', select: 'name profileImage phone' },
        { path: 'volunteer', select: 'name profileImage phone' },
        { path: 'request', select: 'title type status' }
      ]);
    }

    if (!chat) {
      return res.status(400).json({
        success: false,
        message: 'Chat not available. Request must be accepted first.'
      });
    }

    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error fetching/creating chat:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/chats/:chatId/messages
// @desc    Send a message
// @access  Private
router.post('/:chatId/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this chat'
      });
    }

    // Add message
    chat.messages.push({
      sender: req.user._id,
      content: content.trim(),
      isRead: false
    });

    await chat.save();

    await chat.populate([
      { path: 'messages.sender', select: 'name profileImage' }
    ]);

    const newMessage = chat.messages[chat.messages.length - 1];

    // 🔥 EMIT SOCKET EVENT
    const io = getIO(req);
    io.to(`chat:${chat._id}`).emit('chat:message', {
      chatId: chat._id,
      message: newMessage
    });

    res.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/chats/:chatId/read
// @desc    Mark messages as read
// @access  Private
router.put('/:chatId/read', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this chat'
      });
    }

    chat.messages.forEach(message => {
      if (message.sender.toString() !== req.user._id.toString() && !message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
      }
    });

    await chat.save();

    // 🔥 EMIT SOCKET EVENT
    const io = getIO(req);
    io.to(`chat:${chat._id}`).emit('chat:messagesRead', {
      chatId: chat._id,
      readBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/chats/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive: true
    });

    let unreadCount = 0;
    chats.forEach(chat => {
      chat.messages.forEach(message => {
        if (message.sender.toString() !== req.user._id.toString() && !message.isRead) {
          unreadCount++;
        }
      });
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      unreadCount: 0
    });
  }
});

module.exports = router;