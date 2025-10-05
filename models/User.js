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
  },
   profileImage: String,
  address: {
    street: String,
    barangay: String,
    city: String,
    province: String
  },
  bio: String,
  publicProfile: {
    showPhone: {
      type: Boolean,
      default: false
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showAddress: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    totalHelped: {
      type: Number,
      default: 0
    },
    totalDonated: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    completedRequests: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    }
  },
  leaderboardRank: Number,
  lastActive: {
    type: Date,
    default: Date.now
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
