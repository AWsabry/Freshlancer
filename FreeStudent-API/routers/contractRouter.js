const express = require('express');
const contractController = require('../controllers/contractController');
const authController = require('../controllers/authController');

const router = express.Router();

// All routes require authentication
router.use(authController.protect);

// Routes for both students and clients
router.get('/me', contractController.getMyContracts);
router.get('/:id', contractController.getContract);
router.patch('/:id/accept', contractController.acceptContract);
router.post('/:id/cancel', contractController.cancelContract);

// Client-only routes
router.post('/', authController.restrictTo('client'), contractController.createContract);
router.patch('/:id/milestones/:milestoneId/approve', authController.restrictTo('client'), contractController.approveMilestone);
router.post('/:id/milestones/:milestoneId/release-payment', authController.restrictTo('client'), contractController.releaseMilestonePayment);

// Student-only routes
router.post('/:id/milestones/:milestoneId/submit', authController.restrictTo('student'), contractController.submitMilestone);

module.exports = router;
