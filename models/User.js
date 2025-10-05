// ============================================
// models/User.js
// ============================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    match: [/^\+63\d{10}$/, 'Phone must be +639XXXXXXXXX']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  userType: {
    type: String,
    enum: ['individual', 'organization', 'company', 'government'],
    default: 'individual'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalHelps: {
    type: Number,
    default: 0
  },
  totalDonated: {
    type: Number,
    default: 0
  },
  badges: [{
    name: String,
    type: String,
    earnedAt: Date
  }],
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
