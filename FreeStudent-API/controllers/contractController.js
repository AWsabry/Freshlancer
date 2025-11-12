const Contract = require('../models/contractModel');
const JobPost = require('../models/jobPostModel');
const JobApplication = require('../models/jobApplicationModel');
const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Create contract (client only)
exports.createContract = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'client') {
    return next(new AppError('Only clients can create contracts', 403));
  }

  const { applicationId, title, description, agreedBudget, agreedTimeline, expectedCompletionDate, milestones } = req.body;

  // Get application
  const application = await JobApplication.findById(applicationId);
  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  // Verify client owns the job post
  const jobPost = await JobPost.findById(application.jobPost);
  if (jobPost.client.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only create contracts for your own job posts', 403));
  }

  // Create contract
  const contract = await Contract.create({
    jobPost: application.jobPost,
    application: applicationId,
    client: req.user._id,
    student: application.student._id,
    title,
    description,
    agreedBudget,
    agreedTimeline,
    expectedCompletionDate,
    milestones: milestones || [],
  });

  // Notify student
  await Notification.create({
    user: application.student._id,
    type: 'contract_created',
    title: 'Contract Offer Received',
    message: `You received a contract offer for "${title}". Please review and accept the terms.`,
    relatedId: contract._id,
    relatedType: 'Contract',
    actionUrl: `/contracts/${contract._id}`,
    priority: 'high',
    icon: 'contract',
  });

  res.status(201).json({
    status: 'success',
    data: {
      contract,
    },
  });
});

// Get my contracts
exports.getMyContracts = catchAsync(async (req, res, next) => {
  const filter = {};

  if (req.user.role === 'student') {
    filter.student = req.user._id;
  } else if (req.user.role === 'client') {
    filter.client = req.user._id;
  }

  if (req.query.status) filter.status = req.query.status;

  const contracts = await Contract.find(filter).sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: contracts.length,
    data: {
      contracts,
    },
  });
});

// Get single contract
exports.getContract = catchAsync(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check authorization
  const isAuthorized =
    contract.client._id.toString() === req.user._id.toString() ||
    contract.student._id.toString() === req.user._id.toString();

  if (!isAuthorized) {
    return next(new AppError('You are not authorized to view this contract', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      contract,
    },
  });
});

// Accept contract terms
exports.acceptContract = catchAsync(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check if user is client or student
  const isClient = contract.client._id.toString() === req.user._id.toString();
  const isStudent = contract.student._id.toString() === req.user._id.toString();

  if (!isClient && !isStudent) {
    return next(new AppError('You are not a party to this contract', 403));
  }

  // Accept terms based on role
  if (isClient) {
    contract.termsAcceptedByClient = true;
    contract.clientAcceptedAt = Date.now();
  } else if (isStudent) {
    contract.termsAcceptedByStudent = true;
    contract.studentAcceptedAt = Date.now();
  }

  // If both accepted, activate contract
  if (contract.termsAcceptedByClient && contract.termsAcceptedByStudent) {
    contract.status = 'active';
  }

  await contract.save();

  res.status(200).json({
    status: 'success',
    data: {
      contract,
      message: 'Contract terms accepted successfully',
    },
  });
});

// Submit milestone (student only)
exports.submitMilestone = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can submit milestones', 403));
  }

  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  if (contract.student._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not the student for this contract', 403));
  }

  const milestone = contract.milestones.id(req.params.milestoneId);

  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  milestone.status = 'submitted';
  milestone.submittedAt = Date.now();
  milestone.deliverables = req.body.deliverables || [];

  await contract.save();

  // Notify client
  await Notification.create({
    user: contract.client._id,
    type: 'milestone_submitted',
    title: 'Milestone Submitted',
    message: `Student submitted milestone: "${milestone.title}"`,
    relatedId: contract._id,
    relatedType: 'Contract',
    actionUrl: `/contracts/${contract._id}`,
    priority: 'high',
    icon: 'contract',
  });

  res.status(200).json({
    status: 'success',
    data: {
      contract,
    },
  });
});

// Approve milestone (client only)
exports.approveMilestone = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'client') {
    return next(new AppError('Only clients can approve milestones', 403));
  }

  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  if (contract.client._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not the client for this contract', 403));
  }

  const milestone = contract.milestones.id(req.params.milestoneId);

  if (!milestone) {
    return next(new AppError('Milestone not found', 404));
  }

  milestone.status = 'approved';
  milestone.approvedAt = Date.now();

  await contract.save();

  // Notify student
  await Notification.create({
    user: contract.student._id,
    type: 'milestone_approved',
    title: 'Milestone Approved',
    message: `Client approved milestone: "${milestone.title}"`,
    relatedId: contract._id,
    relatedType: 'Contract',
    actionUrl: `/contracts/${contract._id}`,
    priority: 'high',
    icon: 'success',
  });

  res.status(200).json({
    status: 'success',
    data: {
      contract,
    },
  });
});

// Release milestone payment (client only)
exports.releaseMilestonePayment = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'client') {
    return next(new AppError('Only clients can release payments', 403));
  }

  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  if (contract.client._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not the client for this contract', 403));
  }

  await contract.releaseMilestonePayment(req.params.milestoneId);

  // Notify student
  await Notification.create({
    user: contract.student._id,
    type: 'payment_released',
    title: 'Payment Released',
    message: `Payment released for milestone in contract "${contract.title}"`,
    relatedId: contract._id,
    relatedType: 'Contract',
    priority: 'high',
    icon: 'payment',
  });

  res.status(200).json({
    status: 'success',
    data: {
      contract,
    },
  });
});

// Cancel contract
exports.cancelContract = catchAsync(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  // Check authorization
  const isAuthorized =
    contract.client._id.toString() === req.user._id.toString() ||
    contract.student._id.toString() === req.user._id.toString();

  if (!isAuthorized) {
    return next(new AppError('You are not authorized to cancel this contract', 403));
  }

  if (!req.body.reason) {
    return next(new AppError('Cancellation reason is required', 400));
  }

  contract.status = 'cancelled';
  contract.cancelledBy = req.user._id;
  contract.cancelledAt = Date.now();
  contract.cancellationReason = req.body.reason;

  await contract.save();

  res.status(200).json({
    status: 'success',
    data: {
      contract,
      message: 'Contract cancelled successfully',
    },
  });
});
