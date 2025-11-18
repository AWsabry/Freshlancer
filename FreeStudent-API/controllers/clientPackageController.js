const ClientPackage = require('../models/clientPackageModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Points package configurations
const packageConfigs = {
  basic: {
    name: '50 Points',
    pointsTotal: 50,
    price: 29.99,
    description: 'Perfect for small projects',
  },
  professional: {
    name: '150 Points',
    pointsTotal: 150,
    price: 79.99,
    description: 'Most popular choice - 12% savings',
  },
  enterprise: {
    name: '500 Points',
    pointsTotal: 500,
    price: 249.99,
    description: 'Best value for large teams - 17% savings',
  },
};

// Get available packages (public)
exports.getAvailablePackages = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      packages: packageConfigs,
    },
  });
});

// Purchase package
exports.purchasePackage = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'client') {
    return next(new AppError('Only clients can purchase packages', 403));
  }

  const { packageType, paymentMethod } = req.body;

  if (!packageConfigs[packageType]) {
    return next(new AppError('Invalid package type', 400));
  }

  const config = packageConfigs[packageType];

  // Create package (points purchase)
  const clientPackage = await ClientPackage.create({
    client: req.user._id,
    packageType,
    packageName: config.name,
    pointsTotal: config.pointsTotal,
    pointsRemaining: config.pointsTotal,
    price: {
      amount: config.price,
      currency: 'USD',
    },
    paymentMethod: paymentMethod || 'credit_card',
    paymentStatus: 'pending',
  });

  // Create transaction
  const transaction = await Transaction.create({
    user: req.user._id,
    type: 'package_purchase',
    amount: config.price,
    currency: 'USD',
    status: 'pending',
    paymentMethod: paymentMethod || 'credit_card',
    description: `${config.name} purchase`,
    relatedId: clientPackage._id,
    relatedType: 'ClientPackage',
  });

  // Note: Integrate payment gateway here
  // For testing: Auto-complete payment (remove this in production)
  transaction.status = 'completed';
  transaction.completedAt = Date.now();
  await transaction.save();

  clientPackage.paymentStatus = 'completed';
  clientPackage.activationDate = Date.now();
  await clientPackage.save();

  // Update user's points and current package
  const user = await User.findById(req.user._id);
  user.clientProfile.pointsRemaining = (user.clientProfile.pointsRemaining || 0) + config.pointsTotal;
  user.clientProfile.currentPackage = clientPackage._id;
  await user.save({ validateBeforeSave: false });

  // Create notification
  await Notification.create({
    user: req.user._id,
    type: 'system_announcement',
    title: 'Points Added Successfully',
    message: `${config.pointsTotal} points have been added to your account! You now have ${user.clientProfile.pointsRemaining} points available. Points never expire.`,
    relatedId: clientPackage._id,
    relatedType: 'ClientPackage',
    icon: 'success',
  });

  res.status(201).json({
    status: 'success',
    data: {
      package: clientPackage,
      transaction,
      pointsRemaining: user.clientProfile.pointsRemaining,
    },
  });
});

// Get my current package
exports.getMyPackage = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'client') {
    return next(new AppError('Only clients have packages', 403));
  }

  const clientPackage = await ClientPackage.findOne({
    client: req.user._id,
    status: 'active',
  }).sort('-purchaseDate');

  res.status(200).json({
    status: 'success',
    data: {
      package: clientPackage,
    },
  });
});

// Get my package history
exports.getMyPackageHistory = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'client') {
    return next(new AppError('Only clients can view package history', 403));
  }

  const packages = await ClientPackage.find({
    client: req.user._id,
  }).sort('-purchaseDate');

  res.status(200).json({
    status: 'success',
    results: packages.length,
    data: {
      packages,
    },
  });
});

// Get points balance
exports.getPointsBalance = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'client') {
    return next(new AppError('Only clients have points', 403));
  }

  const clientPackage = await ClientPackage.findOne({
    client: req.user._id,
    status: 'active',
  });

  if (!clientPackage) {
    return res.status(200).json({
      status: 'success',
      data: {
        pointsAvailable: 0,
        hasActivePackage: false,
        message: 'No active package. Please purchase a package to access profiles.',
      },
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      pointsTotal: clientPackage.pointsTotal,
      pointsRemaining: clientPackage.pointsRemaining,
      pointsUsed: clientPackage.pointsUsed,
      hasActivePackage: true,
      packageType: clientPackage.packageType,
      expiryDate: clientPackage.expiryDate,
      profileViewsPerJob: clientPackage.profileViewsPerJob,
    },
  });
});

// Cancel package
exports.cancelPackage = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'client') {
    return next(new AppError('Only clients can cancel packages', 403));
  }

  const clientPackage = await ClientPackage.findOne({
    client: req.user._id,
    status: 'active',
    _id: req.params.id,
  });

  if (!clientPackage) {
    return next(new AppError('No active package found', 404));
  }

  clientPackage.status = 'cancelled';
  clientPackage.cancelledAt = Date.now();
  clientPackage.cancellationReason = req.body.reason;

  await clientPackage.save();

  res.status(200).json({
    status: 'success',
    data: {
      package: clientPackage,
      message: 'Package cancelled successfully',
    },
  });
});

// Admin: Get all packages
exports.getAllPackages = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.packageType) filter.packageType = req.query.packageType;

  const packages = await ClientPackage.find(filter).sort('-purchaseDate');

  res.status(200).json({
    status: 'success',
    results: packages.length,
    data: {
      packages,
    },
  });
});

// Admin: Get package statistics
exports.getPackageStats = catchAsync(async (req, res, next) => {
  const stats = await ClientPackage.aggregate([
    {
      $match: { paymentStatus: 'completed' },
    },
    {
      $group: {
        _id: '$packageType',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$price.amount' },
        totalPointsSold: { $sum: '$pointsTotal' },
        totalPointsUsed: { $sum: '$pointsUsed' },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});
