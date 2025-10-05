// ============================================
// models/Transaction.js - FIXED VERSION
// ============================================
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  type: {
    type: String,
    enum: ['donation', 'relief', 'transfer'],
    default: 'donation'
  },
  amount: {
    type: Number,
    required: true,
    min: 10
  },
  platformFee: {
    type: Number,
    required: true,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  gcashReference: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  confirmedAt: Date,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String
}, {
  timestamps: true
});

// Index for queries
transactionSchema.index({ donor: 1, createdAt: -1 });
transactionSchema.index({ recipient: 1, createdAt: -1 });
transactionSchema.index({ request: 1 });
transactionSchema.index({ status: 1 });

// Populate recipient from request before save
transactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.recipient) {
    try {
      const Request = mongoose.model('Request');
      const request = await Request.findById(this.request).select('requester');
      if (request) {
        this.recipient = request.requester;
      }
    } catch (error) {
      console.error('Error populating recipient:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);