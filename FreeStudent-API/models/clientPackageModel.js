const mongoose = require('mongoose');

const clientPackageSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Package must belong to a client'],
  },
  packageType: {
    type: String,
    required: [true, 'Package type is required'],
    enum: {
      values: ['basic', 'professional', 'enterprise', 'custom'],
      message: 'Package type must be basic, professional, enterprise, or custom',
    },
  },
  packageName: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
  },
  // Points system
  pointsTotal: {
    type: Number,
    required: [true, 'Total points is required'],
    min: [0, 'Points cannot be negative'],
  },
  pointsRemaining: {
    type: Number,
    required: [true, 'Remaining points is required'],
    min: [0, 'Points cannot be negative'],
  },
  pointsUsed: {
    type: Number,
    default: 0,
    min: [0, 'Points used cannot be negative'],
  },
  // Profile view limits per job post
  profileViewsPerJob: {
    type: Number,
    required: [true, 'Profile views per job is required'],
    min: [1, 'Must allow at least 1 profile view per job'],
  },
  // Pricing
  price: {
    amount: {
      type: Number,
      required: [true, 'Price amount is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'EGP'],
      default: 'USD',
    },
  },
  // Package validity
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  activationDate: Date,
  expiryDate: {
    type: Date,
    validate: {
      validator: function (val) {
        return !val || val > this.purchaseDate;
      },
      message: 'Expiry date must be after purchase date',
    },
  },
  validityDays: {
    type: Number,
    default: 30, // Default 30 days validity
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'expired', 'exhausted', 'cancelled'],
      message: 'Status must be active, expired, exhausted, or cancelled',
    },
    default: 'active',
  },
  // Package features
  features: {
    unlimitedJobPosts: {
      type: Boolean,
      default: false,
    },
    featuredJobPosts: {
      type: Number,
      default: 0, // Number of featured job posts allowed
    },
    priorityListing: {
      type: Boolean,
      default: false,
    },
    advancedFilters: {
      type: Boolean,
      default: false,
    },
    bulkInvites: {
      type: Boolean,
      default: false,
    },
    dedicatedSupport: {
      type: Boolean,
      default: false,
    },
    analyticsAccess: {
      type: Boolean,
      default: false,
    },
  },
  // Usage tracking
  jobPostsCreated: {
    type: Number,
    default: 0,
  },
  profilesUnlocked: {
    type: Number,
    default: 0,
  },
  invitesSent: {
    type: Number,
    default: 0,
  },
  // Payment details
  transactionId: String,
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'stripe'],
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: false,
  },
  renewalDate: Date,
  // Cancellation
  cancelledAt: Date,
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason must be less than 500 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better query performance
clientPackageSchema.index({ client: 1, status: 1 });
clientPackageSchema.index({ expiryDate: 1 });
clientPackageSchema.index({ status: 1 });

// Update the updatedAt field
clientPackageSchema.pre('save', function (next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Set expiry date based on validity days when package is created
clientPackageSchema.pre('save', function (next) {
  if (this.isNew && !this.expiryDate && this.validityDays) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + this.validityDays);
    this.expiryDate = expiry;
  }
  next();
});

// Update client's total points when package is saved
clientPackageSchema.post('save', async function () {
  if (this.status === 'active') {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.client, {
      'clientProfile.currentPackage': this._id,
      'clientProfile.totalPointsAvailable': this.pointsRemaining,
    });
  }
});

// Method to check if package has expired
clientPackageSchema.methods.isExpired = function () {
  return this.expiryDate && Date.now() > this.expiryDate;
};

// Method to check if points are available
clientPackageSchema.methods.hasPointsAvailable = function (pointsNeeded) {
  return this.pointsRemaining >= pointsNeeded;
};

// Method to consume points
clientPackageSchema.methods.consumePoints = async function (points, purpose) {
  if (!this.hasPointsAvailable(points)) {
    throw new Error('Insufficient points');
  }

  this.pointsRemaining -= points;
  this.pointsUsed += points;

  if (purpose === 'profile_unlock') {
    this.profilesUnlocked += 1;
  }

  if (this.pointsRemaining === 0) {
    this.status = 'exhausted';
  }

  await this.save();
};

// Populate client information when querying
clientPackageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'client',
    select: 'name email photo role clientProfile.companyName',
  });
  next();
});

const ClientPackage = mongoose.model('ClientPackage', clientPackageSchema);

module.exports = ClientPackage;
