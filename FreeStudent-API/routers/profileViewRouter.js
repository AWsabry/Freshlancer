const express = require('express');
const profileViewController = require('../controllers/profileViewController');
const authController = require('../controllers/authController');

const router = express.Router();

// All routes require authentication
router.use(authController.protect);

// Public routes (any authenticated user)
router.get('/:studentId/anonymized', profileViewController.getAnonymizedProfile);

// Client routes
router.post('/unlock', authController.restrictTo('client'), profileViewController.unlockProfile);
router.get('/viewed', authController.restrictTo('client'), profileViewController.getMyViewedProfiles);
router.get('/shortlisted', authController.restrictTo('client'), profileViewController.getShortlistedProfiles);
router.post('/shortlist', authController.restrictTo('client'), profileViewController.shortlistProfile);
router.patch('/action', authController.restrictTo('client'), profileViewController.updateProfileAction);

// Student routes
router.get('/viewers', authController.restrictTo('student'), profileViewController.getMyProfileViewers);

// Admin routes
router.get('/', authController.restrictTo('admin'), profileViewController.getAllProfileViews);
router.get('/stats', authController.restrictTo('admin'), profileViewController.getProfileViewStats);

module.exports = router;
