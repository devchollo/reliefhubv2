// ============================================
// models/Request.js - FIXED VERSION
// ============================================
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['food', 'water', 'shelter', 'clothing', 'medical', 'money', 'other']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['food', 'medical', 'shelter', 'other'],
    default: function() { 
      // Map type to category for frontend compatibility
      const mapping = {
        'food': 'food',
        'medical': 'medical',
        'shelter': 'shelter',
        'clothing': 'other',
        'money': 'other',
        'water': 'food',
        'other': 'other'
      };
      return mapping[this.type] || 'other';
    }
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  quantity: String,
  items: {
    type: [String],
    default: function() {
      // Default items based on type
      return [this.type];
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length === 2;
        },
        message: 'Coordinates must be [longitude, latitude]'
      }
    },
    barangay: String,
    city: String
  },
  address: String,
  status: {
    type: String,
    enum: ['open', 'pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acceptedAt: Date,
  markedCompleteAt: Date,
  completedAt: Date,
  gcashNumber: String,
  amountNeeded: Number,
  amountReceived: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial index for location queries
requestSchema.index({ location: '2dsphere' });

// Index for common queries
requestSchema.index({ status: 1, isActive: 1, createdAt: -1 });
requestSchema.index({ requester: 1, status: 1 });
requestSchema.index({ volunteer: 1, status: 1 });

// Virtual for backward compatibility
requestSchema.virtual('acceptedByUser').get(function() {
  return this.acceptedBy || this.volunteer;
});

// Ensure both acceptedBy and volunteer are synced
requestSchema.pre('save', function(next) {
  if (this.isModified('volunteer') && !this.acceptedBy) {
    this.acceptedBy = this.volunteer;
  }
  if (this.isModified('acceptedBy') && !this.volunteer) {
    this.volunteer = this.acceptedBy;
  }
  next();
});

module.exports = mongoose.model('Request', requestSchema);