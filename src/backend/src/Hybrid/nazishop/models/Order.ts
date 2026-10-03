import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    orderId: string;
    userId: string;
    userEmail: string;
    userName: string;
    productId: string;
    productName: string;
    category: 'STREAMING' | 'SOCIAL_MEDIA' | 'METHODS';
    amount: number;
    currency?: string;
    amountUSD?: number;
    exchangeRate?: number;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    streamingPlan?: string;
    streamingDuration?: string;
    streamingEmail?: string;
    streamingPassword?: string;
    streamingPin?: string;
    streamingProfileName?: string;
    socialUsername?: string;
    socialFollowersCount?: number;
    socialDeliveryStatus?: string;
    methodType?: string;
    methodEmail?: string;
    methodPassword?: string;
    methodAdditionalData?: string;
    paymentMethod?: string;
    transactionId?: string;
}

const OrderSchema = new Schema<IOrder>({
    orderId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    category: { type: String, enum: ['STREAMING', 'SOCIAL_MEDIA', 'METHODS'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'MXN', 'COP'], default: 'USD' },
    amountUSD: { type: Number },
    exchangeRate: { type: Number },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'], default: 'PENDING' },
    completedAt: Date,
    streamingPlan: String,
    streamingDuration: String,
    streamingEmail: String,
    streamingPassword: String,
    streamingPin: String,
    streamingProfileName: String,
    socialUsername: String,
    socialFollowersCount: Number,
    socialDeliveryStatus: String,
    methodType: String,
    methodEmail: String,
    methodPassword: String,
    methodAdditionalData: String,
    paymentMethod: String,
    transactionId: String
}, { timestamps: true });

OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ category: 1, status: 1 });

export default mongoose.model<IOrder>('NaziShopOrder', OrderSchema);
