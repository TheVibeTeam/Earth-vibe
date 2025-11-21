import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
    barcode: string;
    productName: string;
    brand: string;
    category?: string;
    quantity?: string;
    points: number;
    isActive: boolean;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
    barcode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    productName: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'Bebida'
    },
    quantity: {
        type: String,
        default: ''
    },
    points: {
        type: Number,
        required: true,
        default: 10
    },
    isActive: {
        type: Boolean,
        default: true
    },
    imageUrl: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

export default model<IProduct>('Product', ProductSchema);
