const ClientPackage = require('../models/clientPackageModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const paymobService = require('../utils/paymob');

// Currency conversion rate (USD to EGP)
const USD_TO_EGP_RATE = 49.5;

// Points package configurations (in USD)
const packageConfigs = {
  basic: {
    name: '500 Points',
    pointsTotal: 500,
    priceUSD: 9.99,
    profileViewsPerJob: 50,
    description: 'Perfect for small projects',
  },
  professional: {
    name: '1000 Points',
    pointsTotal: 1000,
    priceUSD: 14.99,
    profileViewsPerJob: 100,
    description: 'Most popular choice',
  },
  enterprise: {
    name: '2000 Points',
    pointsTotal: 2000,
    priceUSD: 21.99,
    profileViewsPerJob: 200,
    description: 'For large Access',
  },
};

// Helper function to get price in the requested currency
const getPriceForCurrency = (priceUSD, currency) => {
  if (currency === 'EGP') {
    return Math.round(priceUSD * USD_TO_EGP_RATE * 100) / 100;
  }
  return priceUSD;
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

  const { packageType, paymentMethod, currency = 'USD', amount } = req.body;

  if (!packageConfigs[packageType]) {
    return next(new AppError('Invalid package type', 400));
  }

  const config = packageConfigs[packageType];

  // Use the amount sent from frontend (includes processing fees) or calculate it
  // Convert base price to the requested currency
  const packagePrice = getPriceForCurrency(config.priceUSD, currency);

  // Use the total amount from frontend (which includes processing fees)
  const totalAmount = amount || packagePrice;

  // Create package (points purchase)
  const clientPackage = await ClientPackage.create({
    client: req.user._id,
    packageType,
    packageName: config.name,
    pointsTotal: config.pointsTotal,
    pointsRemaining: config.pointsTotal,
    profileViewsPerJob: config.profileViewsPerJob,
    price: {
      amount: packagePrice, // Base price without fees
      currency: currency,
    },
    paymentMethod: paymentMethod || 'credit_card',
    paymentStatus: 'pending',
  });

  // Create transaction with the total amount (including fees)
  const transaction = await Transaction.create({
    user: req.user._id,
    type: 'package_purchase',
    amount: totalAmount,
    currency: currency,
    status: 'pending',
    paymentMethod: paymentMethod || 'credit_card',
    description: `${config.name} purchase`,
    relatedId: clientPackage._id,
    relatedType: 'ClientPackage',
  });

  // If currency is EGP, use Paymob payment gateway
  if (currency === 'EGP') {
    try {
      // Get user information
      const user = await User.findById(req.user._id);

      // Prepare customer data
      const customer = {
        firstName: user.name?.split(' ')[0] || 'Guest',
        lastName: user.name?.split(' ').slice(1).join(' ') || 'User',
        email: user.email,
        phone: user.phone || '+201000000000',
        extras: {
          userId: user._id.toString(),
          userRole: user.role,
          paymentType: 'package',
          packageId: clientPackage._id.toString(),
        },
      };

      // Create Paymob payment intention with total amount (includes processing fees)
      const paymentIntention = await paymobService.createPaymentIntention({
        amount: totalAmount,
        currency: 'EGP',
        items: [{
          name: config.name,
          amount: totalAmount,
          description: `${config.pointsTotal} points package`,
          quantity: 1,
        }],
        billingData: req.body.billingData,
        customer,
        integrationId: req.body.integrationId,
      });

      // Update transaction with Paymob details
      transaction.metadata = {
        intentionId: paymentIntention.intentionId,
        clientSecret: paymentIntention.clientSecret,
        paymentUrl: paymentIntention.paymentUrl,
      };
      await transaction.save();

      // Return payment URL to redirect user to Paymob
      return res.status(200).json({
        status: 'success',
        data: {
          package: clientPackage,
          transaction,
          paymentUrl: paymentIntention.paymentUrl,
          clientSecret: paymentIntention.clientSecret,
          intentionId: paymentIntention.intentionId,
          message: 'Please complete payment with Paymob',
        },
      });
    } catch (error) {
      // If Paymob fails, return error
      console.error('Paymob payment creation failed:', error);
      return next(new AppError('Failed to create payment. Please try again.', 500));
    }
  }

  // For non-EGP currencies, payment gateway integration required
  return next(
    new AppError(
      'Payment gateway for this currency is not yet integrated. Please use EGP currency or contact support.',
      400
    )
  );
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

  // Get user with client profile
  const user = await User.findById(req.user._id);

  if (!user || !user.clientProfile) {
    return next(new AppError('Client profile not found', 404));
  }

  const pointsRemaining = user.clientProfile.pointsRemaining || 0;
  const pointsUsed = user.clientProfile.pointsUsed || 0;
  const unlockedStudentsCount = user.clientProfile.unlockedStudents?.length || 0;

  res.status(200).json({
    status: 'success',
    data: {
      pointsRemaining,
      pointsUsed,
      unlockedStudentsCount,
      hasPoints: pointsRemaining > 0,
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
