const paymobService = require('../utils/paymob');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');

// Create payment intention
exports.createPaymentIntention = catchAsync(async (req, res, next) => {
  const {
    amount,
    currency = 'EGP',
    items = [],
    billingData,
    integrationId,
    paymentType, // 'subscription' or 'package'
  } = req.body;

  if (!amount || amount <= 0) {
    return next(new AppError('Amount is required and must be greater than 0', 400));
  }

  // Get user information
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prepare customer data
  const customer = {
    firstName: user.name?.split(' ')[0] || 'Guest',
    lastName: user.name?.split(' ').slice(1).join(' ') || 'User',
    email: user.email,
    phone: user.phone || '+201000000000',
    extras: {
      userId: user._id.toString(),
      userRole: user.role,
      paymentType: paymentType || 'general',
    },
  };

  // Create payment intention with Paymob
  const paymentIntention = await paymobService.createPaymentIntention({
    amount,
    currency,
    items: items.length > 0 ? items : [{
      name: paymentType === 'subscription' ? 'Premium Subscription' : 'Points Package',
      amount: amount,
      description: `${paymentType || 'Payment'} for ${user.name}`,
      quantity: 1,
    }],
    billingData,
    customer,
    integrationId,
  });

  // Create transaction record
  const transaction = await Transaction.create({
    user: req.user._id,
    type: paymentType === 'subscription' ? 'subscription' : 'package_purchase',
    amount,
    currency,
    status: 'pending',
    paymentMethod: 'paymob',
    description: `Paymob payment intention created`,
    metadata: {
      intentionId: paymentIntention.intentionId,
      clientSecret: paymentIntention.clientSecret,
      paymentUrl: paymentIntention.paymentUrl,
    },
  });

  res.status(200).json({
    status: 'success',
    data: {
      intentionId: paymentIntention.intentionId,
      clientSecret: paymentIntention.clientSecret,
      paymentUrl: paymentIntention.paymentUrl,
      transaction: transaction._id,
      message: 'Payment intention created successfully',
    },
  });
});

// Verify payment
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { intentionId } = req.params;

  if (!intentionId) {
    return next(new AppError('Intention ID is required', 400));
  }

  const paymentStatus = await paymobService.verifyPayment(intentionId);

  // Update transaction status
  const transaction = await Transaction.findOne({
    'metadata.intentionId': intentionId,
  });

  if (transaction) {
    transaction.status = paymentStatus.isPaid ? 'completed' : 'pending';
    if (paymentStatus.isPaid) {
      transaction.completedAt = Date.now();
    }
    await transaction.save();
  }

  res.status(200).json({
    status: 'success',
    data: {
      intentionId,
      paymentStatus: paymentStatus.status,
      isPaid: paymentStatus.isPaid,
      transactionId: transaction?._id,
      fullData: paymentStatus.data,
    },
  });
});

// Handle Paymob webhook
exports.handleWebhook = catchAsync(async (req, res, next) => {
  const webhookData = req.body;

  console.log('=== PAYMOB WEBHOOK RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());

  // Process webhook data
  const processedData = paymobService.processWebhook(webhookData);

  console.log('\n📊 PAYMENT STATUS SUMMARY:');
  console.log('Transaction ID:', processedData.transactionId);
  console.log('Intention/Order ID:', processedData.intentionId);
  console.log('Amount:', `${processedData.currency} ${processedData.amount}`);
  console.log('Status:', processedData.status);
  console.log('Is Paid:', processedData.isPaid ? '✅ YES' : '❌ NO');
  console.log('Payment Method:', processedData.paymentMethod);

  if (processedData.cardType) {
    console.log('Card Type:', processedData.cardType);
    console.log('Card Last 4:', processedData.cardLastFour);
  }

  console.log('\nFull Webhook Payload:', JSON.stringify(webhookData, null, 2));
  console.log('Processed Webhook Data:', JSON.stringify(processedData, null, 2));

  // Find and update transaction
  const transaction = await Transaction.findOne({
    'metadata.intentionId': processedData.intentionId,
  });

  if (!transaction) {
    return next(new AppError('Transaction not found', 404));
  }

  // Update transaction status
  transaction.status = processedData.isPaid ? 'completed' : 'failed';
  if (processedData.isPaid) {
    transaction.completedAt = Date.now();
  }
  transaction.metadata = {
    ...transaction.metadata,
    webhookData: processedData,
    transactionId: processedData.transactionId,
    orderId: processedData.orderId,
  };
  await transaction.save();

  // If payment is successful, handle based on transaction type
  if (processedData.isPaid) {
    const Subscription = require('../models/subscriptionModel');
    const ClientPackage = require('../models/clientPackageModel');
    const Notification = require('../models/notificationModel');

    const user = await User.findById(transaction.user);

    if (transaction.type === 'subscription_payment') {
      // Handle subscription upgrade
      const subscription = await Subscription.findById(transaction.relatedId);

      if (subscription) {
        subscription.status = 'active';
        await subscription.save();
      }

      if (user && user.studentProfile) {
        user.studentProfile.subscriptionTier = 'premium';
        user.studentProfile.subscriptionStartDate = Date.now();
        // Set expiry to 1 month from now
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        user.studentProfile.subscriptionExpiryDate = expiryDate;
        await user.save({ validateBeforeSave: false });

        // Create notification
        await Notification.create({
          user: user._id,
          type: 'subscription_renewed',
          title: 'Premium Subscription Activated',
          message: 'Your premium subscription is now active! You can now apply to up to 100 jobs per month.',
          relatedId: subscription._id,
          relatedType: 'Subscription',
          priority: 'high',
          icon: 'success',
        });
      }

      console.log('Subscription activated for user:', user._id);
    } else if (transaction.type === 'package_purchase') {
      // Handle package purchase (points)
      const clientPackage = await ClientPackage.findById(transaction.relatedId);

      if (clientPackage) {
        clientPackage.paymentStatus = 'completed';
        clientPackage.activationDate = Date.now();
        await clientPackage.save();

        // Update user's points
        if (user && user.clientProfile) {
          user.clientProfile.pointsRemaining = (user.clientProfile.pointsRemaining || 0) + clientPackage.pointsTotal;
          user.clientProfile.currentPackage = clientPackage._id;
          await user.save({ validateBeforeSave: false });

          // Create notification
          await Notification.create({
            user: user._id,
            type: 'system_announcement',
            title: 'Points Added Successfully',
            message: `${clientPackage.pointsTotal} points have been added to your account! You now have ${user.clientProfile.pointsRemaining} points available. Points never expire.`,
            relatedId: clientPackage._id,
            relatedType: 'ClientPackage',
            icon: 'success',
          });
        }

        console.log('Package activated for user:', user._id);
      }
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Webhook processed successfully',
  });
});

// Get payment status as JSON (for frontend to check status)
exports.getPaymentStatus = catchAsync(async (req, res, next) => {
  const { id } = req.query; // Paymob sends 'id' as the intention ID

  if (!id) {
    return res.status(400).json({
      status: 'fail',
      message: 'Payment intention ID is required',
    });
  }

  console.log('=== PAYMENT STATUS CHECK ===');
  console.log('Intention ID:', id);

  try {
    // Find transaction
    const transaction = await Transaction.findOne({
      'metadata.intentionId': id,
    }).populate('user');

    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found',
      });
    }

    console.log('Transaction found:', transaction._id);
    console.log('Transaction status:', transaction.status);

    return res.status(200).json({
      status: 'success',
      data: {
        intentionId: id,
        transactionId: transaction._id,
        paymentStatus: transaction.status,
        isPaid: transaction.status === 'completed',
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
        completedAt: transaction.completedAt,
        user: {
          id: transaction.user._id,
          name: transaction.user.name,
          email: transaction.user.email,
        },
      },
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to check payment status',
      error: error.message,
    });
  }
});

// Success callback - called after successful payment
exports.paymentSuccess = catchAsync(async (req, res, next) => {
  const { id } = req.query; // Paymob sends 'id' as the intention ID

  if (!id) {
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=missing_id`);
  }

  console.log('=== PAYMENT SUCCESS CALLBACK ===');
  console.log('Intention ID:', id);
  console.log('Query Params:', req.query);

  try {
    // Find transaction - Paymob redirects here only on successful payment
    const transaction = await Transaction.findOne({
      'metadata.intentionId': id,
    }).populate('user');

    if (!transaction) {
      console.error('Transaction not found for intention ID:', id);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=transaction_not_found`);
    }

    console.log('Transaction found:', transaction._id);
    console.log('Transaction type:', transaction.type);
    console.log('Transaction status:', transaction.status);

    // Update transaction status
    transaction.status = 'completed';
    transaction.completedAt = Date.now();

    // Update metadata properly for Mongoose Map
    transaction.metadata.set('verifiedAt', Date.now());
    transaction.metadata.set('successCallbackReceived', Date.now());

    await transaction.save();

    console.log('Transaction updated to completed');

    // Process based on transaction type
    const Subscription = require('../models/subscriptionModel');
    const ClientPackage = require('../models/clientPackageModel');
    const Notification = require('../models/notificationModel');

    const user = await User.findById(transaction.user);

    if (!user) {
      console.error('User not found for transaction:', transaction.user);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=user_not_found`);
    }

    console.log('User found:', user._id, user.email);

    if (transaction.type === 'subscription_payment') {
      console.log('=== PROCESSING SUBSCRIPTION PAYMENT ===');
      // Handle subscription upgrade
      const subscription = await Subscription.findById(transaction.relatedId);

      if (subscription) {
        console.log('Subscription found:', subscription._id);
        console.log('Current plan:', subscription.plan);

        subscription.plan = 'premium'; // Upgrade to premium plan
        subscription.status = 'active';
        subscription.startDate = Date.now();
        // Set end date to 1 month from now
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        subscription.endDate = endDate;
        subscription.lastPaymentDate = Date.now();
        subscription.applicationLimitPerMonth = 100; // Premium gets 100 apps/month
        await subscription.save();

        console.log('Subscription upgraded to:', subscription.plan);
      } else {
        console.warn('Subscription not found for relatedId:', transaction.relatedId);
      }

      if (user && user.studentProfile) {
        console.log('Updating user profile to premium');

        user.studentProfile.subscriptionTier = 'premium';
        user.studentProfile.subscriptionStartDate = Date.now();
        // Set expiry to 1 month from now
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        user.studentProfile.subscriptionExpiryDate = expiryDate;
        await user.save({ validateBeforeSave: false });

        console.log('User profile updated to premium');

        // Create notification
        await Notification.create({
          user: user._id,
          type: 'subscription_renewed',
          title: 'Premium Subscription Activated',
          message: 'Your premium subscription is now active! You can now apply to up to 100 jobs per month.',
          relatedId: subscription?._id,
          relatedType: 'Subscription',
          priority: 'high',
          icon: 'success',
        });

        console.log('Notification created');
      }

      console.log('✅ Subscription activated successfully for user:', user._id);

      // Redirect to payment processing page to check status
      return res.redirect(`${process.env.FRONTEND_URL}/payment/processing?id=${id}`);
    } else if (transaction.type === 'package_purchase') {
      console.log('=== PROCESSING PACKAGE PURCHASE ===');
      // Handle package purchase (points)
      const clientPackage = await ClientPackage.findById(transaction.relatedId);

      if (clientPackage) {
        console.log('Package found:', clientPackage._id);
        console.log('Points total:', clientPackage.pointsTotal);

        clientPackage.paymentStatus = 'completed';
        clientPackage.activationDate = Date.now();
        await clientPackage.save();

        console.log('Package status updated to completed');

        // Update user's points
        if (user && user.clientProfile) {
          const previousPoints = user.clientProfile.pointsRemaining || 0;
          user.clientProfile.pointsRemaining = previousPoints + clientPackage.pointsTotal;
          user.clientProfile.currentPackage = clientPackage._id;
          await user.save({ validateBeforeSave: false });

          console.log('Points updated:', previousPoints, '→', user.clientProfile.pointsRemaining);

          // Create notification
          await Notification.create({
            user: user._id,
            type: 'system_announcement',
            title: 'Points Added Successfully',
            message: `${clientPackage.pointsTotal} points have been added to your account! You now have ${user.clientProfile.pointsRemaining} points available. Points never expire.`,
            relatedId: clientPackage._id,
            relatedType: 'ClientPackage',
            icon: 'success',
          });

          console.log('Notification created');
        }

        console.log('✅ Package activated successfully for user:', user._id);

        // Redirect to payment processing page to check status
        return res.redirect(`${process.env.FRONTEND_URL}/payment/processing?id=${id}`);
      } else {
        console.warn('Package not found for relatedId:', transaction.relatedId);
      }
    }

    // Default redirect if no specific type
    console.log('No specific transaction type matched, using default redirect');
    return res.redirect(`${process.env.FRONTEND_URL}/payment/processing?id=${id}`);
  } catch (error) {
    console.error('Payment success callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=processing_error`);
  }
});

// Test webhook endpoint - simulates Paymob sending webhook data
exports.testWebhook = catchAsync(async (req, res, next) => {
  // Sample webhook data from Paymob (based on documentation)
  const sampleWebhookData = {
    type: "TRANSACTION",
    obj: {
      id: req.body.transactionId || 192036465,
      pending: false,
      amount_cents: req.body.amount_cents || 100000,
      success: true,
      is_auth: false,
      is_capture: false,
      is_standalone_payment: true,
      is_voided: false,
      is_refunded: false,
      is_3d_secure: true,
      integration_id: 4097558,
      order: {
        id: req.body.orderId || 217503754,
        amount_cents: req.body.amount_cents || 100000,
        currency: "EGP",
      },
      created_at: new Date().toISOString(),
      currency: "EGP",
      success: true,
    }
  };

  console.log('=== TESTING WEBHOOK WITH SAMPLE DATA ===');
  console.log('Sample Webhook Data:', JSON.stringify(sampleWebhookData, null, 2));

  // Process the sample webhook
  const processedData = paymobService.processWebhook(sampleWebhookData);

  console.log('Processed Data:', JSON.stringify(processedData, null, 2));

  res.status(200).json({
    status: 'success',
    message: 'Webhook test completed',
    sampleData: sampleWebhookData,
    processedData,
    note: 'Check your server console for detailed logs',
  });
});

// Test endpoint to verify Paymob integration
exports.testPaymobIntegration = catchAsync(async (req, res, next) => {
  // Test data
  const testPaymentData = {
    amount: 100, // 100 EGP
    currency: 'EGP',
    items: [{
      name: 'Test Item',
      amount: 100,
      description: 'Test payment integration',
      quantity: 1,
    }],
    billingData: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phoneNumber: '+201000000000',
      apartment: 'NA',
      floor: 'NA',
      street: 'Test Street',
      building: 'NA',
      country: 'EGY',
      state: 'NA',
    },
    customer: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+201000000000',
      extras: {
        testMode: true,
      },
    },
  };

  try {
    const result = await paymobService.createPaymentIntention(testPaymentData);

    res.status(200).json({
      status: 'success',
      message: 'Paymob integration test successful',
      data: {
        intentionId: result.intentionId,
        clientSecret: result.clientSecret,
        paymentUrl: result.paymentUrl,
        fullResponse: result.data,
      },
      note: 'This is a test payment intention. Use the paymentUrl to complete the payment in test mode.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Paymob integration test failed',
      error: error.message,
      details: error.response?.data || null,
    });
  }
});
