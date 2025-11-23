const express = require('express');
const paymobController = require('../controllers/paymobController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public webhook endpoint (no authentication required for Paymob callbacks)
router.post('/webhook', paymobController.handleWebhook);

// Public success callback endpoint (no authentication required - user redirected from Paymob)
router.get('/success', paymobController.paymentSuccess);

// Test endpoint (protected for security)
router.post('/test', authController.protect, paymobController.testPaymobIntegration);

// All routes below require authentication
router.use(authController.protect);

// Create payment intention
router.post('/create-intention', paymobController.createPaymentIntention);

// Verify payment status
router.get('/verify/:intentionId', paymobController.verifyPayment);

module.exports = router;
