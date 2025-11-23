const Review = require('../models/reviewModel');
const Contract = require('../models/contractModel');
const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Create review
exports.createReview = catchAsync(async (req, res, next) => {
  const { contractId, rating, categoryRatings, comment, pros, cons, wouldRecommend, isPublic } = req.body;

  if (!contractId || !rating || !comment) {
    return next(new AppError('Contract ID, rating, and comment are required', 400));
  }

  // Get contract
  const contract = await Contract.findById(contractId);

  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  if (contract.status !== 'completed') {
    return next(new AppError('Can only review completed contracts', 400));
  }

  // Determine reviewer and reviewee
  let revieweeId, revieweeRole;

  if (req.user._id.toString() === contract.client._id.toString()) {
    // Client reviewing student
    revieweeId = contract.student._id;
    revieweeRole = 'student';
  } else if (req.user._id.toString() === contract.student._id.toString()) {
    // Student reviewing client
    revieweeId = contract.client._id;
    revieweeRole = 'client';
  } else {
    return next(new AppError('You are not a party to this contract', 403));
  }

  // Check if review already exists
  const existingReview = await Review.findOne({
    contract: contractId,
    reviewer: req.user._id,
  });

  if (existingReview) {
    return next(new AppError('You have already reviewed this contract', 400));
  }

  // Create review
  const review = await Review.create({
    contract: contractId,
    reviewer: req.user._id,
    reviewerRole: req.user.role,
    reviewee: revieweeId,
    revieweeRole,
    rating,
    categoryRatings: categoryRatings || {},
    comment,
    pros,
    cons,
    wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
    isPublic: isPublic !== undefined ? isPublic : true,
  });

  // Notify reviewee
  await Notification.create({
    user: revieweeId,
    type: 'review_received',
    title: 'New Review Received',
    message: `You received a ${rating}-star review for contract "${contract.title}"`,
    relatedId: review._id,
    relatedType: 'Review',
    actionUrl: `/reviews/${review._id}`,
    priority: 'normal',
    icon: 'review',
  });

  res.status(201).json({
    status: 'success',
    data: {
      review,
    },
  });
});

// Get reviews for a user
exports.getReviewsForUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const filter = {
    reviewee: userId,
    isPublic: true,
    isHidden: false,
  };

  const reviews = await Review.find(filter).sort('-createdAt');

  const ratingBreakdown = await Review.getUserRatingBreakdown(userId);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
      ratingBreakdown,
    },
  });
});

// Get my reviews (reviews I wrote)
exports.getMyReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({
    reviewer: req.user._id,
  }).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

// Get reviews about me
exports.getReviewsAboutMe = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({
    reviewee: req.user._id,
    isPublic: true,
    isHidden: false,
  }).sort('-createdAt');

  const ratingBreakdown = await Review.getUserRatingBreakdown(req.user._id);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
      ratingBreakdown,
    },
  });
});

// Respond to review
exports.respondToReview = catchAsync(async (req, res, next) => {
  const { text } = req.body;

  if (!text) {
    return next(new AppError('Response text is required', 400));
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  // Check if user is the reviewee
  if (review.reviewee._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only respond to reviews about you', 403));
  }

  if (review.response && review.response.text) {
    return next(new AppError('You have already responded to this review', 400));
  }

  review.response = {
    text,
    respondedAt: Date.now(),
  };

  await review.save();

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

// Vote review as helpful
exports.voteHelpful = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  try {
    await review.voteHelpful(req.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        review,
        message: 'Vote recorded',
      },
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// Remove helpful vote
exports.removeVote = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  try {
    await review.removeVote(req.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        review,
        message: 'Vote removed',
      },
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// Report review
exports.reportReview = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    return next(new AppError('Report reason is required', 400));
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  review.isReported = true;
  review.reportedBy = req.user._id;
  review.reportedAt = Date.now();
  review.reportReason = reason;

  await review.save();

  res.status(200).json({
    status: 'success',
    data: {
      message: 'Review reported successfully',
    },
  });
});

// Admin: Hide review
exports.hideReview = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  review.isHidden = true;
  review.hiddenBy = req.user._id;
  review.hiddenAt = Date.now();
  review.hiddenReason = reason;

  await review.save();

  res.status(200).json({
    status: 'success',
    data: {
      review,
      message: 'Review hidden successfully',
    },
  });
});

// Admin: Get reported reviews
exports.getReportedReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({
    isReported: true,
    isHidden: false,
  }).sort('-reportedAt');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});
