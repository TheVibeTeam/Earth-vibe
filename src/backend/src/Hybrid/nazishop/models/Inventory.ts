import { Schema, model, Document } from 'mongoose';

export interface IInventory extends Document {
    serviceId: string;
    email: string;
    password?: string;
    pin?: string;
    profileName?: string;
    expiryDate?: Date;
    plan?: string;
    price?: number;
    duration?: string;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>({
    serviceId: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    pin: {
        type: String,
        default: null
    },
    profileName: {
        type: String,
        default: null
    },
    expiryDate: {
        type: Date,
        default: null
    },
    plan: {
        type: String,
        default: null
    },
    price: {
        type: Number,
        default: null
    },
    duration: {
        type: String,
        default: null
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default model<IInventory>('Inventory', InventorySchema);
