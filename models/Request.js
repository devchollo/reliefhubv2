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
  // ADD THESE FIELDS:
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
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    barangay: String,
    city: String
  },
  address: String,
  status: {
    type: String,
    enum: ['open', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'open'  // Changed from 'pending' to 'open'
  },
  acceptedBy: {  // Changed from 'volunteer' to match frontend
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  volunteer: {  // Keep for backward compatibility
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