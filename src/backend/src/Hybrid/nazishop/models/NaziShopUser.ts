import mongoose, { Schema, Document } from 'mongoose';

export interface INaziShopUser extends Document {
    email: string;
    password?: string;
    displayName?: string;
    photoUrl?: string;
    phoneNumber?: string;
    role: 'USER' | 'ADMIN';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    totalPurchases: number;
    totalSpent: number;
    favoriteServices: string[];
    lastActiveTime?: Date;
}

const NaziShopUserSchema = new Schema<INaziShopUser>({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: String,
    displayName: String,
    photoUrl: String,
    phoneNumber: String,
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    isActive: { type: Boolean, default: true },
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    favoriteServices: [String],
    lastActiveTime: Date
}, { timestamps: true });

NaziShopUserSchema.index({ role: 1, isActive: 1 });
NaziShopUserSchema.index({ totalSpent: -1 });

export default mongoose.model<INaziShopUser>('NaziShopUser', NaziShopUserSchema);
