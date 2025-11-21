import mongoose, { Schema, Document } from 'mongoose';

export interface IChallenge extends Document {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  icon: string;
  targetValue: number; // Objetivo (ej: 10 botellas, 100 puntos)
  rewardPoints: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'special'],
      required: true
    },
    icon: { type: String, required: true }, // Nombre del icono
    targetValue: { type: Number, required: true },
    rewardPoints: { type: Number, required: true },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);
