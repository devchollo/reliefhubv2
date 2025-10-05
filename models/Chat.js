// ============================================
// models/Chat.js - NEW
// ============================================
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
chatSchema.index({ request: 1 });
chatSchema.index({ participants: 1 });
chatSchema.index({ 'messages.createdAt': -1 });

// Update lastMessage before saving
chatSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    const last = this.messages[this.messages.length - 1];
    this.lastMessage = {
      content: last.content,
      sender: last.sender,
      createdAt: last.createdAt
    };
  }
  next();
});

module.exports = mongoose.model('Chat', chatSchema);