const express = require('express');
const clientPackageController = require('../controllers/clientPackageController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public route - anyone can view available packages
router.get('/available', clientPackageController.getAvailablePackages);

// All routes below require authentication
router.use(authController.protect);

// Client routes
router.use(authController.restrictTo('client', 'admin'));

router.post('/purchase', clientPackageController.purchasePackage);
router.get('/me', clientPackageController.getMyPackage);
router.get('/history', clientPackageController.getMyPackageHistory);
router.get('/points-balance', clientPackageController.getPointsBalance);
router.post('/:id/cancel', clientPackageController.cancelPackage);

// Admin routes
router.use(authController.restrictTo('admin'));

router.get('/', clientPackageController.getAllPackages);
router.get('/stats', clientPackageController.getPackageStats);

module.exports = router;
