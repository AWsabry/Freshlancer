const JobApplication = require('../models/jobApplicationModel');
const JobPost = require('../models/jobPostModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

// Apply for a job (only students)
exports.applyForJob = catchAsync(async (req, res, next) => {
  // Ensure only students can apply for jobs
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can apply for jobs', 403));
  }

  // Check if job post exists and is open
  const jobPost = await JobPost.findById(req.params.jobId);
  if (!jobPost) {
    return next(new AppError('Job post not found', 404));
  }

  if (jobPost.status !== 'open') {
    return next(
      new AppError('This job post is no longer accepting applications', 400)
    );
  }

  // Check if student has already applied
  const existingApplication = await JobApplication.findOne({
    jobPost: req.params.jobId,
    student: req.user.id,
  });

  if (existingApplication) {
    return next(new AppError('You have already applied for this job', 400));
  }

  // Create the application
  const applicationData = {
    ...req.body,
    jobPost: req.params.jobId,
    student: req.user.id,
  };

  const application = await JobApplication.create(applicationData);

  // Send notification email to client
  try {
    await sendEmail({
      type: 'job-application',
      email: jobPost.client.email,
      name: jobPost.client.name,
      subject: `New Application for "${jobPost.title}"`,
      message: `You have received a new application for your job post "${jobPost.title}" from ${req.user.name}.`,
      jobTitle: jobPost.title,
      studentName: req.user.name,
      applicationUrl: `${req.protocol}://${req.get('host')}/applications/${
        application._id
      }`,
    });
  } catch (err) {
    console.log('Failed to send application notification email:', err.message);
  }

  res.status(201).json({
    status: 'success',
    message: 'Application submitted successfully',
    data: {
      application,
    },
  });
});

// Get all applications for a user
exports.getMyApplications = catchAsync(async (req, res, next) => {
  let query = {};

  if (req.user.role === 'student') {
    // Students see their own applications
    query.student = req.user.id;
  } else if (req.user.role === 'client') {
    // Clients see applications for their job posts
    const myJobPosts = await JobPost.find({ client: req.user.id }).select(
      '_id'
    );
    const jobPostIds = myJobPosts.map((job) => job._id);
    query.jobPost = { $in: jobPostIds };
  }

  // Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((el) => delete queryObj[el]);

  // Add filters to main query
  Object.assign(query, queryObj);

  // Create query
  let mongoQuery = JobApplication.find(query);

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    mongoQuery = mongoQuery.sort(sortBy);
  } else {
    mongoQuery = mongoQuery.sort('-createdAt');
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    mongoQuery = mongoQuery.select(fields);
  } else {
    mongoQuery = mongoQuery.select('-__v');
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  mongoQuery = mongoQuery.skip(skip).limit(limit);

  // Execute query
  const applications = await mongoQuery;
  const total = await JobApplication.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: applications.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: {
      applications,
    },
  });
});

// Get a single application
exports.getApplication = catchAsync(async (req, res, next) => {
  const application = await JobApplication.findById(req.params.id);

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  // Check permissions
  const isOwner = application.student._id.toString() === req.user.id;
  const isJobOwner = application.jobPost.client._id.toString() === req.user.id;

  if (!isOwner && !isJobOwner) {
    return next(
      new AppError(
        'You can only view your own applications or applications for your job posts',
        403
      )
    );
  }

  // Mark as read by client if accessed by client
  if (req.user.role === 'client' && !application.readByClient) {
    await JobApplication.findByIdAndUpdate(req.params.id, {
      readByClient: true,
      readByClientAt: Date.now(),
    });
    application.readByClient = true;
    application.readByClientAt = Date.now();
  }

  res.status(200).json({
    status: 'success',
    data: {
      application,
    },
  });
});

// Update application status (only clients)
exports.updateApplicationStatus = catchAsync(async (req, res, next) => {
  const { status, clientFeedback } = req.body;

  if (req.user.role !== 'client') {
    return next(
      new AppError('Only clients can update application status', 403)
    );
  }

  if (!['reviewed', 'accepted', 'rejected'].includes(status)) {
    return next(
      new AppError(
        'Invalid status. Must be reviewed, accepted, or rejected',
        400
      )
    );
  }

  const application = await JobApplication.findById(req.params.id);

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  // Check if client owns the job post
  if (application.jobPost.client._id.toString() !== req.user.id) {
    return next(
      new AppError('You can only update applications for your job posts', 403)
    );
  }

  // Update application
  const updateData = { status };
  if (clientFeedback) {
    updateData.clientFeedback = {
      ...clientFeedback,
      givenAt: Date.now(),
    };
  }

  const updatedApplication = await JobApplication.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  // If accepted, update job post status to in-progress
  if (status === 'accepted') {
    await JobPost.findByIdAndUpdate(application.jobPost._id, {
      status: 'in-progress',
    });
  }

  // Send notification email to student
  try {
    await sendEmail({
      type: 'application-status-update',
      email: application.student.email,
      name: application.student.name,
      subject: `Application Update for "${application.jobPost.title}"`,
      message: `Your application for "${application.jobPost.title}" has been ${status}.`,
      jobTitle: application.jobPost.title,
      newStatus: status,
      feedback: clientFeedback && clientFeedback.message,
    });
  } catch (err) {
    console.log(
      'Failed to send status update notification email:',
      err.message
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      application: updatedApplication,
    },
  });
});

// Withdraw application (only students)
exports.withdrawApplication = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (req.user.role !== 'student') {
    return next(
      new AppError('Only students can withdraw their applications', 403)
    );
  }

  const application = await JobApplication.findById(req.params.id);

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  // Check if student owns the application
  if (application.student._id.toString() !== req.user.id) {
    return next(
      new AppError('You can only withdraw your own applications', 403)
    );
  }

  // Check if application can be withdrawn
  if (['accepted', 'withdrawn'].includes(application.status)) {
    return next(
      new AppError(
        'Cannot withdraw an accepted or already withdrawn application',
        400
      )
    );
  }

  const updatedApplication = await JobApplication.findByIdAndUpdate(
    req.params.id,
    {
      status: 'withdrawn',
      withdrawnAt: Date.now(),
      withdrawalReason: reason,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Application withdrawn successfully',
    data: {
      application: updatedApplication,
    },
  });
});

// Delete application (only by student who created it, and only if not accepted)
exports.deleteApplication = catchAsync(async (req, res, next) => {
  const application = await JobApplication.findById(req.params.id);

  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  // Check if student owns the application
  if (application.student._id.toString() !== req.user.id) {
    return next(new AppError('You can only delete your own applications', 403));
  }

  // Check if application can be deleted
  if (application.status === 'accepted') {
    return next(new AppError('Cannot delete an accepted application', 400));
  }

  await JobApplication.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Get application statistics
exports.getApplicationStats = catchAsync(async (req, res, next) => {
  let matchStage = {};

  if (req.user.role === 'student') {
    matchStage.student = req.user._id;
  } else if (req.user.role === 'client') {
    const myJobPosts = await JobPost.find({ client: req.user.id }).select(
      '_id'
    );
    const jobPostIds = myJobPosts.map((job) => job._id);
    matchStage.jobPost = { $in: jobPostIds };
  }

  const stats = await JobApplication.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProposedBudget: { $avg: '$proposedBudget.amount' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Monthly application trends
  const monthlyStats = await JobApplication.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      statusStats: stats,
      monthlyStats,
    },
  });
});

// Get applications for a specific job post (only job owner)
exports.getJobApplications = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'client') {
    return next(new AppError('Only clients can view job applications', 403));
  }

  // Check if client owns the job post
  const jobPost = await JobPost.findById(req.params.jobId);
  if (!jobPost) {
    return next(new AppError('Job post not found', 404));
  }

  if (jobPost.client._id.toString() !== req.user.id) {
    return next(
      new AppError('You can only view applications for your own job posts', 403)
    );
  }

  // Get applications
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  const query = { jobPost: req.params.jobId };

  // Add status filter if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  const applications = await JobApplication.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await JobApplication.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: applications.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: {
      applications,
    },
  });
});
