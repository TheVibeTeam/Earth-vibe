import mongoose, { Schema, Document } from 'mongoose';

export interface IRedeem extends Document {
  userId: mongoose.Types.ObjectId;
  rewardId: mongoose.Types.ObjectId;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  message?: string;
}

const RedeemSchema = new Schema<IRedeem>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rewardId: { type: Schema.Types.ObjectId, ref: 'Reward', required: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  message: { type: String },
});

export default mongoose.model<IRedeem>('Redeem', RedeemSchema);
