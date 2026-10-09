import mongoose from 'mongoose';

const goalContributionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FinancialGoal',
      required: [true, 'Goal ID is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Contribution amount is required'],
      min: [0.01, 'Contribution must be greater than 0']
    },
    contributionDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

goalContributionSchema.index({ goalId: 1, contributionDate: -1 });

export const GoalContribution = mongoose.model('GoalContribution', goalContributionSchema);
