const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  contract: {
    type: mongoose.Schema.ObjectId,
    ref: 'Contract',
    required: [true, 'Review must be associated with a contract'],
  },
  reviewer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must have a reviewer'],
  },
  reviewerRole: {
    type: String,
    required: [true, 'Reviewer role is required'],
    enum: ['student', 'client'],
  },
  reviewee: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must have a reviewee'],
  },
  revieweeRole: {
    type: String,
    required: [true, 'Reviewee role is required'],
    enum: ['student', 'client'],
  },
  // Overall rating
  rating: {
    type: Number,
    required: [true, 'Review must have a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be at most 5'],
  },
  // Category ratings (different for student vs client)
  categoryRatings: {
    // For rating clients (by students)
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    clarity: {
      type: Number,
      min: 1,
      max: 5,
    },
    paymentOnTime: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
    wouldWorkAgain: {
      type: Number,
      min: 1,
      max: 5,
    },

    // For rating students (by clients)
    qualityOfWork: {
      type: Number,
      min: 1,
      max: 5,
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5,
    },
    responsiveness: {
      type: Number,
      min: 1,
      max: 5,
    },
    skillLevel: {
      type: Number,
      min: 1,
      max: 5,
    },
    creativity: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  // Review content
  comment: {
    type: String,
    required: [true, 'Review must have a comment'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [2000, 'Comment must be less than 2000 characters'],
  },
  // Pros and cons
  pros: {
    type: String,
    trim: true,
    maxlength: [500, 'Pros must be less than 500 characters'],
  },
  cons: {
    type: String,
    trim: true,
    maxlength: [500, 'Cons must be less than 500 characters'],
  },
  // Recommendation
  wouldRecommend: {
    type: Boolean,
    default: true,
  },
  // Privacy
  isPublic: {
    type: Boolean,
    default: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  // Moderation
  isReported: {
    type: Boolean,
    default: false,
  },
  reportedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  reportedAt: Date,
  reportReason: String,
  isHidden: {
    type: Boolean,
    default: false,
  },
  hiddenBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  hiddenAt: Date,
  hiddenReason: String,
  // Response from reviewee
  response: {
    text: {
      type: String,
      maxlength: [1000, 'Response must be less than 1000 characters'],
    },
    respondedAt: Date,
  },
  // Helpful votes
  helpfulVotes: {
    type: Number,
    default: 0,
  },
  votedBy: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  // Verification
  isVerified: {
    type: Boolean,
    default: true, // Verified if based on actual contract
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

// Ensure only one review per person per contract
reviewSchema.index({ contract: 1, reviewer: 1 }, { unique: true });

// Index for better query performance
reviewSchema.index({ reviewee: 1, isPublic: 1, isHidden: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Update the updatedAt field
reviewSchema.pre('save', function (next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Validate that reviewer and reviewee roles are different
reviewSchema.pre('save', function (next) {
  if (this.reviewerRole === this.revieweeRole) {
    return next(new Error('Reviewer and reviewee must have different roles'));
  }
  next();
});

// Validate that reviewer and reviewee are participants in the contract
reviewSchema.pre('save', async function (next) {
  if (this.isNew) {
    const Contract = mongoose.model('Contract');
    const contract = await Contract.findById(this.contract);

    if (!contract) {
      return next(new Error('Contract not found'));
    }

    const isReviewerParticipant =
      contract.client.toString() === this.reviewer.toString() ||
      contract.student.toString() === this.reviewer.toString();

    const isRevieweeParticipant =
      contract.client.toString() === this.reviewee.toString() ||
      contract.student.toString() === this.reviewee.toString();

    if (!isReviewerParticipant || !isRevieweeParticipant) {
      return next(
        new Error('Reviewer and reviewee must be participants in the contract')
      );
    }
  }
  next();
});

// Update reviewee's rating after review is saved
reviewSchema.post('save', async function () {
  if (this.isNew && this.isPublic && !this.isHidden) {
    const User = mongoose.model('User');
    const Review = mongoose.model('Review');

    // Calculate average rating for reviewee
    const reviews = await Review.find({
      reviewee: this.reviewee,
      isPublic: true,
      isHidden: false,
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await User.findByIdAndUpdate(this.reviewee, {
      'rating.average': averageRating,
      'rating.count': reviews.length,
    });
  }
});

// Populate related documents when querying
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'reviewer',
    select: 'name photo role',
  })
    .populate({
      path: 'reviewee',
      select: 'name photo role rating',
    })
    .populate({
      path: 'contract',
      select: 'title jobPost',
    });
  next();
});

// Method to vote as helpful
reviewSchema.methods.voteHelpful = function (userId) {
  if (this.votedBy.includes(userId)) {
    throw new Error('User has already voted');
  }

  this.votedBy.push(userId);
  this.helpfulVotes += 1;

  return this.save();
};

// Method to remove helpful vote
reviewSchema.methods.removeVote = function (userId) {
  const index = this.votedBy.indexOf(userId);
  if (index === -1) {
    throw new Error('User has not voted');
  }

  this.votedBy.splice(index, 1);
  this.helpfulVotes -= 1;

  return this.save();
};

// Static method to get average ratings for a user
reviewSchema.statics.getUserRatingBreakdown = async function (userId) {
  const reviews = await this.find({
    reviewee: userId,
    isPublic: true,
    isHidden: false,
  });

  if (reviews.length === 0) {
    return null;
  }

  const breakdown = {
    overall: 0,
    communication: 0,
    professionalism: 0,
    quality: 0,
    timeliness: 0,
    count: reviews.length,
  };

  reviews.forEach((review) => {
    breakdown.overall += review.rating;
    if (review.categoryRatings.communication) {
      breakdown.communication += review.categoryRatings.communication;
    }
    if (review.categoryRatings.professionalism) {
      breakdown.professionalism += review.categoryRatings.professionalism;
    }
    if (review.categoryRatings.qualityOfWork) {
      breakdown.quality += review.categoryRatings.qualityOfWork;
    }
    if (review.categoryRatings.timeliness) {
      breakdown.timeliness += review.categoryRatings.timeliness;
    }
  });

  Object.keys(breakdown).forEach((key) => {
    if (key !== 'count') {
      breakdown[key] = breakdown[key] / reviews.length;
    }
  });

  return breakdown;
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
