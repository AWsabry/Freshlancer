const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Message must have a sender'],
  },
  content: {
    type: String,
    required: [true, 'Message must have content'],
    trim: true,
    maxlength: [5000, 'Message content must be less than 5000 characters'],
  },
  attachments: [
    {
      name: String,
      url: String,
      type: {
        type: String,
        enum: ['document', 'image', 'video', 'audio', 'other'],
      },
      size: Number, // in bytes
    },
  ],
  sentAt: {
    type: Date,
    default: Date.now,
  },
  readAt: Date,
  isRead: {
    type: Boolean,
    default: false,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
});

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Conversation must have participants'],
    },
  ],
  // Important: Track who initiated (students cannot initiate)
  initiatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Conversation must have an initiator'],
  },
  initiatedByRole: {
    type: String,
    enum: ['client', 'admin'],
    required: [true, 'Initiator role is required'],
  },
  // Context
  relatedJobPost: {
    type: mongoose.Schema.ObjectId,
    ref: 'JobPost',
  },
  relatedApplication: {
    type: mongoose.Schema.ObjectId,
    ref: 'JobApplication',
  },
  relatedContract: {
    type: mongoose.Schema.ObjectId,
    ref: 'Contract',
  },
  // Messages
  messages: [messageSchema],
  // Status
  status: {
    type: String,
    enum: {
      values: ['active', 'archived', 'blocked'],
      message: 'Status must be active, archived, or blocked',
    },
    default: 'active',
  },
  // Metadata
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  lastMessagePreview: {
    type: String,
    maxlength: 200,
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {},
  },
  // Privacy and moderation
  isReported: {
    type: Boolean,
    default: false,
  },
  reportedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  reportedAt: Date,
  reportReason: String,
  blockedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  blockedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique conversation per participant pair
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ relatedJobPost: 1 });

// Update the updatedAt and lastMessageAt fields
conversationSchema.pre('save', function (next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  if (this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].sentAt;
    this.lastMessagePreview = this.messages[
      this.messages.length - 1
    ].content.substring(0, 200);
  }
  next();
});

// Validate that students cannot initiate conversations
conversationSchema.pre('save', async function (next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    const initiator = await User.findById(this.initiatedBy);

    if (!initiator) {
      return next(new Error('Initiator not found'));
    }

    if (initiator.role === 'student') {
      return next(
        new Error(
          'Students cannot initiate conversations. Only clients can start chats.'
        )
      );
    }

    this.initiatedByRole = initiator.role;
  }
  next();
});

// Validate participants (must be exactly 2 users)
conversationSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'));
  }
  next();
});

// Populate participants when querying
conversationSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'participants',
    select: 'name email photo role',
  })
    .populate({
      path: 'initiatedBy',
      select: 'name email role',
    })
    .populate({
      path: 'relatedJobPost',
      select: 'title category',
    })
    .populate({
      path: 'messages.sender',
      select: 'name photo role',
    });
  next();
});

// Method to add a message
conversationSchema.methods.addMessage = function (senderId, content, attachments = []) {
  // Check if sender is a participant
  const isParticipant = this.participants.some(
    (p) => p._id.toString() === senderId.toString()
  );

  if (!isParticipant) {
    throw new Error('Only participants can send messages');
  }

  const message = {
    sender: senderId,
    content,
    attachments,
    sentAt: Date.now(),
  };

  this.messages.push(message);
  this.lastMessageAt = Date.now();
  this.lastMessagePreview = content.substring(0, 200);

  // Update unread count for other participant
  this.participants.forEach((participantId) => {
    if (participantId.toString() !== senderId.toString()) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });

  return this.save();
};

// Method to mark messages as read
conversationSchema.methods.markAsRead = function (userId) {
  const unreadMessages = this.messages.filter(
    (msg) =>
      msg.sender.toString() !== userId.toString() &&
      !msg.isRead &&
      !msg.isDeleted
  );

  unreadMessages.forEach((msg) => {
    msg.isRead = true;
    msg.readAt = Date.now();
  });

  // Reset unread count for this user
  this.unreadCount.set(userId.toString(), 0);

  return this.save();
};

// Static method to get or create conversation
conversationSchema.statics.getOrCreateConversation = async function (
  initiatorId,
  recipientId,
  jobPostId = null
) {
  const User = mongoose.model('User');
  const initiator = await User.findById(initiatorId);

  if (!initiator) {
    throw new Error('Initiator not found');
  }

  if (initiator.role === 'student') {
    throw new Error('Students cannot initiate conversations');
  }

  // Check if conversation already exists
  let conversation = await this.findOne({
    participants: { $all: [initiatorId, recipientId] },
  });

  if (!conversation) {
    conversation = await this.create({
      participants: [initiatorId, recipientId],
      initiatedBy: initiatorId,
      initiatedByRole: initiator.role,
      relatedJobPost: jobPostId,
    });
  }

  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
