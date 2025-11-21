import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
    serviceId: string;
    name: string;
    description?: string;
    category: 'STREAMING' | 'SOCIAL_MEDIA' | 'METHODS';
    iconCode?: number;
    colorValue?: number;
    isActive: boolean;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
    streamingPlans?: string[];
    streamingDurations?: string[];
    streamingPrices?: number[];
    streamingDevices?: string[];
    socialFollowersPackages?: string[];
    socialPrices?: number[];
    socialDeliveryTime?: string;
    methodTypes?: string[];
    methodPrices?: number[];
    methodInstructions?: string;
}

const ServiceSchema = new Schema<IService>({
    serviceId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    category: { type: String, enum: ['STREAMING', 'SOCIAL_MEDIA', 'METHODS'], required: true },
    iconCode: Number,
    colorValue: Number,
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    streamingPlans: [String],
    streamingDurations: [String],
    streamingPrices: [Number],
    streamingDevices: [String],
    socialFollowersPackages: [String],
    socialPrices: [Number],
    socialDeliveryTime: String,
    methodTypes: [String],
    methodPrices: [Number],
    methodInstructions: String
}, { timestamps: true });

ServiceSchema.index({ category: 1, isActive: 1 });
ServiceSchema.index({ isFeatured: -1, isActive: 1 });

export default mongoose.model<IService>('NaziShopService', ServiceSchema);
