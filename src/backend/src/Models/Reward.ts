import mongoose, { Schema, Document } from 'mongoose';

export interface IReward extends Document {
  name: string;
  description: string;
  imageUrl?: string;
  points: number;
  category: string;
  available: boolean;
}

const RewardSchema = new Schema<IReward>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  points: { type: Number, required: true },
  category: { type: String, required: true },
  available: { type: Boolean, default: true },
});

export default mongoose.model<IReward>('Reward', RewardSchema);
