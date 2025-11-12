const express = require('express');

const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.get('/verifyEmail/:token', authController.verifyEmail);
router.post('/resendVerificationEmail', authController.resendVerificationEmail);

router.use(authController.protect);
router.patch('/updateMyPassword', authController.updatePassword);

module.exports = router;
