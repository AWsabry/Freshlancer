const Subscription = require('../models/subscriptionModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get my subscription
exports.getMySubscription = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'student') {
    return next(new AppError('Only students have subscriptions', 403));
  }

  let subscription = await Subscription.findOne({
    student: req.user._id,
    status: 'active',
  });

  // Create free subscription if none exists
  if (!subscription) {
    subscription = await Subscription.create({
      student: req.user._id,
      plan: 'free',
      status: 'active',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      subscription,
    },
  });
});

// Check application limit
exports.checkApplicationLimit = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can check application limits', 403));
  }

  const subscription = await Subscription.findOne({
    student: req.user._id,
    status: 'active',
  });

  if (!subscription) {
    return next(new AppError('No active subscription found', 404));
  }

  // Check if reset is needed
  if (Date.now() > subscription.limitResetDate) {
    await subscription.resetMonthlyLimit();
  }

  const canApply = subscription.canApply();

  res.status(200).json({
    status: 'success',
    data: {
      canApply: canApply.allowed,
      reason: canApply.reason,
      currentUsage: subscription.applicationsUsedThisMonth,
      limit: subscription.applicationLimitPerMonth,
      plan: subscription.plan,
      resetDate: subscription.limitResetDate,
    },
  });
});

// Upgrade to premium
exports.upgradeToPremium = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can upgrade subscriptions', 403));
  }

  // Find current subscription
  let subscription = await Subscription.findOne({
    student: req.user._id,
    status: 'active',
  });

  if (subscription && subscription.plan === 'premium') {
    return next(new AppError('You already have a premium subscription', 400));
  }

  const premiumPrice = 19.99; // USD per month

  // Create or update subscription
  if (subscription) {
    // Upgrade existing subscription
    subscription.plan = 'premium';
    subscription.applicationLimitPerMonth = 999999;
    subscription.price = {
      amount: premiumPrice,
      currency: 'USD',
    };
    subscription.billingCycle = req.body.billingCycle || 'monthly';
    subscription.autoRenew = req.body.autoRenew || true;
    subscription.paymentMethodId = req.body.paymentMethodId;
    subscription.nextBillingDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ); // 30 days from now

    await subscription.save();
  } else {
    // Create new premium subscription
    subscription = await Subscription.create({
      student: req.user._id,
      plan: 'premium',
      status: 'pending',
      applicationLimitPerMonth: 999999,
      price: {
        amount: premiumPrice,
        currency: 'USD',
      },
      billingCycle: req.body.billingCycle || 'monthly',
      autoRenew: req.body.autoRenew || true,
      paymentMethodId: req.body.paymentMethodId,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  // Create transaction record
  const transaction = await Transaction.create({
    user: req.user._id,
    type: 'subscription_payment',
    amount: premiumPrice,
    currency: 'USD',
    status: 'pending',
    paymentMethod: req.body.paymentMethod || 'credit_card',
    description: `Premium subscription - ${req.body.billingCycle || 'monthly'} billing`,
    relatedId: subscription._id,
    relatedType: 'Subscription',
  });

  // Note: In production, integrate with payment gateway (Stripe/PayPal) here
  // For testing: Auto-complete payment (remove this in production)
  transaction.status = 'completed';
  transaction.completedAt = Date.now();
  await transaction.save();

  subscription.status = 'active';
  await subscription.save();

  // Create notification
  await Notification.create({
    user: req.user._id,
    type: 'subscription_renewed',
    title: 'Premium Subscription Activated',
    message: 'Your premium subscription is now active! Enjoy unlimited job applications.',
    relatedId: subscription._id,
    relatedType: 'Subscription',
    priority: 'high',
    icon: 'success',
  });

  res.status(200).json({
    status: 'success',
    data: {
      subscription,
      transaction,
      message:
        'Subscription upgraded successfully. Please complete payment to activate.',
    },
  });
});

// Cancel subscription
exports.cancelSubscription = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can cancel subscriptions', 403));
  }

  const subscription = await Subscription.findOne({
    student: req.user._id,
    status: 'active',
  });

  if (!subscription) {
    return next(new AppError('No active subscription found', 404));
  }

  if (subscription.plan === 'free') {
    return next(new AppError('Cannot cancel free subscription', 400));
  }

  subscription.status = 'cancelled';
  subscription.cancelledAt = Date.now();
  subscription.cancelledBy = req.user._id;
  subscription.cancellationReason = req.body.reason;
  subscription.autoRenew = false;

  await subscription.save();

  // Create free subscription to replace premium
  await Subscription.create({
    student: req.user._id,
    plan: 'free',
    status: 'active',
  });

  // Create notification
  await Notification.create({
    user: req.user._id,
    type: 'subscription_expiring',
    title: 'Subscription Cancelled',
    message: 'Your premium subscription has been cancelled. You now have a free account.',
    relatedId: subscription._id,
    relatedType: 'Subscription',
    priority: 'normal',
    icon: 'info',
  });

  res.status(200).json({
    status: 'success',
    data: {
      subscription,
      message:
        'Subscription cancelled successfully. You have been downgraded to free plan.',
    },
  });
});

// Renew subscription (auto-renewal)
exports.renewSubscription = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can renew subscriptions', 403));
  }

  const subscription = await Subscription.findOne({
    student: req.user._id,
    status: 'active',
  });

  if (!subscription) {
    return next(new AppError('No active subscription found', 404));
  }

  if (subscription.plan === 'free') {
    return next(new AppError('Free subscriptions do not need renewal', 400));
  }

  // Create renewal transaction
  const transaction = await Transaction.create({
    user: req.user._id,
    type: 'subscription_payment',
    amount: subscription.price.amount,
    currency: subscription.price.currency,
    status: 'pending',
    paymentMethod: req.body.paymentMethod || 'credit_card',
    description: `Premium subscription renewal - ${subscription.billingCycle}`,
    relatedId: subscription._id,
    relatedType: 'Subscription',
  });

  // Update subscription dates
  subscription.lastPaymentDate = Date.now();
  subscription.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await subscription.save();

  res.status(200).json({
    status: 'success',
    data: {
      subscription,
      transaction,
      message: 'Subscription renewed successfully',
    },
  });
});

// Get subscription history
exports.getSubscriptionHistory = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can view subscription history', 403));
  }

  const subscriptions = await Subscription.find({
    student: req.user._id,
  }).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: subscriptions.length,
    data: {
      subscriptions,
    },
  });
});

// Admin: Get all subscriptions
exports.getAllSubscriptions = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.plan) filter.plan = req.query.plan;
  if (req.query.status) filter.status = req.query.status;

  const subscriptions = await Subscription.find(filter).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: subscriptions.length,
    data: {
      subscriptions,
    },
  });
});

// Admin: Get subscription statistics
exports.getSubscriptionStats = catchAsync(async (req, res, next) => {
  const stats = await Subscription.aggregate([
    {
      $match: { status: 'active' },
    },
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
        totalRevenue: {
          $sum: '$price.amount',
        },
      },
    },
  ]);

  const totalSubscriptions = await Subscription.countDocuments({ status: 'active' });

  res.status(200).json({
    status: 'success',
    data: {
      total: totalSubscriptions,
      stats,
    },
  });
});
