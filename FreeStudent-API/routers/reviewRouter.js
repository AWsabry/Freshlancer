const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();

// All routes require authentication
router.use(authController.protect);

// Routes for all authenticated users
router.post('/', reviewController.createReview);
router.get('/user/:userId', reviewController.getReviewsForUser);
router.get('/me', reviewController.getMyReviews);
router.get('/about-me', reviewController.getReviewsAboutMe);
router.post('/:id/respond', reviewController.respondToReview);
router.post('/:id/vote-helpful', reviewController.voteHelpful);
router.delete('/:id/vote', reviewController.removeVote);
router.post('/:id/report', reviewController.reportReview);

// Admin routes
router.use(authController.restrictTo('admin'));

router.get('/reported', reviewController.getReportedReviews);
router.patch('/:id/hide', reviewController.hideReview);

module.exports = router;
