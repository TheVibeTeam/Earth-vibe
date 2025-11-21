import mongoose, { Schema, Document } from 'mongoose';

export interface IUserChallenge extends Document {
  userId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  progress: number; 
  isCompleted: boolean;
  completedAt?: Date;
  claimedReward: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserChallengeSchema: Schema = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    challengeId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Challenge', 
      required: true 
    },
    progress: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    claimedReward: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

UserChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

export default mongoose.model<IUserChallenge>('UserChallenge', UserChallengeSchema);
