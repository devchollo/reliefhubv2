// ============================================
// models/Transaction.js
// ============================================
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10
  },
  platformFee: {
    type: Number,
    required: true
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
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
