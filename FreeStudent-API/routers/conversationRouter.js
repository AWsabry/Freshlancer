const express = require('express');
const conversationController = require('../controllers/conversationController');
const authController = require('../controllers/authController');

const router = express.Router();

// All routes require authentication
router.use(authController.protect);

// Routes for all authenticated users
router.get('/', conversationController.getMyConversations);
router.get('/unread-count', conversationController.getUnreadCount);
router.get('/:id', conversationController.getConversation);
router.post('/:id/messages', conversationController.sendMessage);
router.patch('/:id/read', conversationController.markAsRead);
router.post('/:id/archive', conversationController.archiveConversation);
router.post('/:id/report', conversationController.reportConversation);

// Create conversation (client/admin only - students cannot initiate)
router.post('/', authController.restrictTo('client', 'admin'), conversationController.createConversation);

module.exports = router;
