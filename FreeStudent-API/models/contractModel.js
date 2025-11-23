const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Milestone must have a title'],
    trim: true,
    maxlength: [200, 'Milestone title must be less than 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Milestone description must be less than 1000 characters'],
  },
  amount: {
    type: Number,
    required: [true, 'Milestone must have an amount'],
    min: [0, 'Amount cannot be negative'],
  },
  dueDate: {
    type: Date,
    required: [true, 'Milestone must have a due date'],
  },
  status: {
    type: String,
    enum: {
      values: [
        'pending',
        'in_progress',
        'submitted',
        'revision_requested',
        'approved',
        'rejected',
      ],
      message:
        'Status must be pending, in_progress, submitted, revision_requested, approved, or rejected',
    },
    default: 'pending',
  },
  deliverables: [
    {
      name: String,
      url: String,
      type: String,
      uploadedAt: Date,
    },
  ],
  submittedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  revisionNotes: {
    type: String,
    maxlength: [1000, 'Revision notes must be less than 1000 characters'],
  },
  paymentReleased: {
    type: Boolean,
    default: false,
  },
  paymentReleasedAt: Date,
});

const contractSchema = new mongoose.Schema({
  jobPost: {
    type: mongoose.Schema.ObjectId,
    ref: 'JobPost',
    required: [true, 'Contract must be associated with a job post'],
  },
  application: {
    type: mongoose.Schema.ObjectId,
    ref: 'JobApplication',
    required: [true, 'Contract must be based on an application'],
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Contract must have a client'],
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Contract must have a student'],
  },
  // Contract terms
  title: {
    type: String,
    required: [true, 'Contract must have a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Contract must have a description'],
    trim: true,
  },
  agreedBudget: {
    amount: {
      type: Number,
      required: [true, 'Contract must have an agreed budget'],
      min: [1, 'Budget must be at least $1'],
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'EGP'],
      default: 'USD',
    },
  },
  agreedTimeline: {
    type: String,
    required: [true, 'Contract must have an agreed timeline'],
    enum: [
      'Less than 1 week',
      '1-2 weeks',
      '2-4 weeks',
      '1-3 months',
      'More than 3 months',
    ],
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  expectedCompletionDate: {
    type: Date,
    required: [true, 'Contract must have an expected completion date'],
  },
  actualCompletionDate: Date,
  // Milestones
  milestones: [milestoneSchema],
  // Payment and escrow
  escrowAmount: {
    type: Number,
    default: 0,
  },
  escrowStatus: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded', 'disputed'],
    default: 'pending',
  },
  totalPaid: {
    type: Number,
    default: 0,
  },
  paymentReleased: {
    type: Boolean,
    default: false,
  },
  paymentReleasedAt: Date,
  // Status
  status: {
    type: String,
    enum: {
      values: [
        'pending_acceptance',
        'active',
        'in_progress',
        'submitted',
        'completed',
        'cancelled',
        'disputed',
        'terminated',
      ],
      message: 'Invalid contract status',
    },
    default: 'pending_acceptance',
  },
  // Terms and conditions
  termsAcceptedByStudent: {
    type: Boolean,
    default: false,
  },
  termsAcceptedByClient: {
    type: Boolean,
    default: false,
  },
  studentAcceptedAt: Date,
  clientAcceptedAt: Date,
  // Deliverables
  finalDeliverables: [
    {
      name: String,
      url: String,
      type: String,
      uploadedAt: Date,
      description: String,
    },
  ],
  // Cancellation/Termination
  cancelledBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  cancelledAt: Date,
  cancellationReason: {
    type: String,
    maxlength: [1000, 'Cancellation reason must be less than 1000 characters'],
  },
  // Dispute
  isDisputed: {
    type: Boolean,
    default: false,
  },
  disputeReason: String,
  disputeFiledBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  disputeFiledAt: Date,
  disputeResolvedAt: Date,
  disputeResolution: String,
  // Contract number
  contractNumber: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better query performance
contractSchema.index({ client: 1, status: 1 });
contractSchema.index({ student: 1, status: 1 });
contractSchema.index({ jobPost: 1 });
contractSchema.index({ status: 1, createdAt: -1 });

// Generate unique contract number
contractSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.contractNumber = `CON-${Date.now()}-${(count + 1)
      .toString()
      .padStart(4, '0')}`;
  }
  next();
});

// Update the updatedAt field
contractSchema.pre('save', function (next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Validate that both parties have accepted before marking as active
contractSchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    this.status === 'active' &&
    (!this.termsAcceptedByStudent || !this.termsAcceptedByClient)
  ) {
    return next(
      new Error('Both parties must accept terms before contract becomes active')
    );
  }
  next();
});

// Set actual completion date when status changes to completed
contractSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed') {
    this.actualCompletionDate = Date.now();
  }
  next();
});

// Update job post status when contract is created
contractSchema.post('save', async function () {
  if (this.isNew && this.status === 'active') {
    const JobPost = mongoose.model('JobPost');
    await JobPost.findByIdAndUpdate(this.jobPost, {
      status: 'in-progress',
    });
  }
});

// Update job post status when contract is completed
contractSchema.post('save', async function () {
  if (this.isModified('status') && this.status === 'completed') {
    const JobPost = mongoose.model('JobPost');
    await JobPost.findByIdAndUpdate(this.jobPost, {
      status: 'completed',
    });

    // Update student's completed projects count
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.student, {
      $inc: { completedProjects: 1, totalEarnings: this.agreedBudget.amount },
    });
  }
});

// Populate related documents when querying
contractSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'client',
    select: 'name email photo clientProfile.companyName',
  })
    .populate({
      path: 'student',
      select: 'name email photo studentProfile.skills rating',
    })
    .populate({
      path: 'jobPost',
      select: 'title category budget',
    })
    .populate({
      path: 'application',
      select: 'proposedBudget estimatedDuration',
    });
  next();
});

// Method to add milestone
contractSchema.methods.addMilestone = function (milestoneData) {
  this.milestones.push(milestoneData);
  return this.save();
};

// Method to calculate total escrow needed
contractSchema.methods.calculateEscrow = function () {
  const total = this.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
  return total;
};

// Method to release payment for milestone
contractSchema.methods.releaseMilestonePayment = async function (milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  if (milestone.status !== 'approved') {
    throw new Error('Milestone must be approved before payment release');
  }

  milestone.paymentReleased = true;
  milestone.paymentReleasedAt = Date.now();
  this.totalPaid += milestone.amount;

  // Check if all milestones are paid
  const allPaid = this.milestones.every((m) => m.paymentReleased);
  if (allPaid) {
    this.paymentReleased = true;
    this.paymentReleasedAt = Date.now();
    this.status = 'completed';
  }

  return this.save();
};

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
