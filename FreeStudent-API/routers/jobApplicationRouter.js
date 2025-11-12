const express = require('express');
const jobApplicationController = require('../controllers/jobApplicationController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Routes for job applications
router.route('/').get(jobApplicationController.getMyApplications);

router.get('/stats', jobApplicationController.getApplicationStats);

router
  .route('/:id')
  .get(jobApplicationController.getApplication)
  .patch(
    authController.restrictTo('client'),
    jobApplicationController.updateApplicationStatus
  )
  .delete(
    authController.restrictTo('student'),
    jobApplicationController.deleteApplication
  );

router.patch(
  '/:id/withdraw',
  authController.restrictTo('student'),
  jobApplicationController.withdrawApplication
);

// Apply for a specific job post
router.post(
  '/apply/:jobId',
  authController.restrictTo('student'),
  jobApplicationController.applyForJob
);

// Get applications for a specific job post (for clients)
router.get(
  '/job/:jobId',
  authController.restrictTo('client'),
  jobApplicationController.getJobApplications
);

module.exports = router;
