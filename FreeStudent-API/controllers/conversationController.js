const Conversation = require('../models/conversationModel');
const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get my conversations
exports.getMyConversations = catchAsync(async (req, res, next) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
    status: { $ne: 'blocked' },
  }).sort('-lastMessageAt');

  res.status(200).json({
    status: 'success',
    results: conversations.length,
    data: {
      conversations,
    },
  });
});

// Get single conversation
exports.getConversation = catchAsync(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check if user is a participant
  const isParticipant = conversation.participants.some(
    (p) => p._id.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this conversation', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      conversation,
    },
  });
});

// Create conversation (client/admin only - students cannot initiate)
exports.createConversation = catchAsync(async (req, res, next) => {
  if (req.user.role === 'student') {
    return next(
      new AppError(
        'Students cannot initiate conversations. Only clients can start chats.',
        403
      )
    );
  }

  const { recipientId, jobPostId, initialMessage } = req.body;

  if (!recipientId) {
    return next(new AppError('Recipient ID is required', 400));
  }

  // Check if conversation already exists
  let conversation = await Conversation.getOrCreateConversation(
    req.user._id,
    recipientId,
    jobPostId
  );

  // Send initial message if provided
  if (initialMessage) {
    await conversation.addMessage(req.user._id, initialMessage);
  }

  res.status(201).json({
    status: 'success',
    data: {
      conversation,
    },
  });
});

// Send message
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { content, attachments } = req.body;

  if (!content) {
    return next(new AppError('Message content is required', 400));
  }

  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check if user is a participant
  const isParticipant = conversation.participants.some(
    (p) => p._id.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this conversation', 403));
  }

  // Add message
  await conversation.addMessage(req.user._id, content, attachments || []);

  // Notify other participant(s)
  const otherParticipants = conversation.participants.filter(
    (p) => p._id.toString() !== req.user._id.toString()
  );

  for (const participant of otherParticipants) {
    await Notification.create({
      user: participant._id,
      type: 'new_message',
      title: 'New Message',
      message: `You have a new message from ${req.user.name}`,
      relatedId: conversation._id,
      relatedType: 'Conversation',
      actionUrl: `/conversations/${conversation._id}`,
      actionText: 'View Message',
      priority: 'normal',
      icon: 'message',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      conversation,
      message: conversation.messages[conversation.messages.length - 1],
    },
  });
});

// Mark conversation as read
exports.markAsRead = catchAsync(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check if user is a participant
  const isParticipant = conversation.participants.some(
    (p) => p._id.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this conversation', 403));
  }

  await conversation.markAsRead(req.user._id);

  res.status(200).json({
    status: 'success',
    data: {
      conversation,
      message: 'Messages marked as read',
    },
  });
});

// Archive conversation
exports.archiveConversation = catchAsync(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check if user is a participant
  const isParticipant = conversation.participants.some(
    (p) => p._id.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this conversation', 403));
  }

  conversation.status = 'archived';
  await conversation.save();

  res.status(200).json({
    status: 'success',
    data: {
      conversation,
      message: 'Conversation archived successfully',
    },
  });
});

// Report conversation
exports.reportConversation = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    return next(new AppError('Report reason is required', 400));
  }

  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check if user is a participant
  const isParticipant = conversation.participants.some(
    (p) => p._id.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this conversation', 403));
  }

  conversation.isReported = true;
  conversation.reportedBy = req.user._id;
  conversation.reportedAt = Date.now();
  conversation.reportReason = reason;

  await conversation.save();

  res.status(200).json({
    status: 'success',
    data: {
      message: 'Conversation reported successfully',
    },
  });
});

// Get unread count
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  });

  let totalUnread = 0;
  conversations.forEach((conv) => {
    const unreadCount = conv.unreadCount.get(req.user._id.toString()) || 0;
    totalUnread += unreadCount;
  });

  res.status(200).json({
    status: 'success',
    data: {
      unreadCount: totalUnread,
    },
  });
});
