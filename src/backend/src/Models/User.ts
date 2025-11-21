import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct {
    barcode: string;
    productName: string;
    brand: string;
    quantity: string;
    points: number;
    scannedAt: Date;
}

export interface IComment {
    userId: mongoose.Types.ObjectId;
    username: string;
    content: string;
    createdAt: Date;
}

export interface IPost {
    content: string;
    imageUrl?: string;
    likes: mongoose.Types.ObjectId[];
    comments: mongoose.Types.DocumentArray<IComment & Document>;
    favorites: mongoose.Types.ObjectId[];
    createdAt: Date;
}

export interface IUser extends Document {
    email: string;
    password: string;
    username: string;
    name: string;
    bio?: string;
    profilePicture?: string;
    university: string;
    faculty: string;
    verified: boolean;
    role: 'user' | 'admin' | 'superadmin';
    googleId?: string;
    points: number;
    totalScans: number;
    fcmToken?: string;
    scannedProducts: IProduct[];
    posts: mongoose.Types.DocumentArray<IPost & Document>;
    redeems: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const PostSchema = new Schema<IPost>({
    content: { type: String, required: true },
    imageUrl: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new Schema<IProduct>({
    barcode: { type: String, required: true },
    productName: { type: String, required: true },
    brand: { type: String, required: true },
    quantity: { type: String, required: true },
    points: { type: Number, required: true, default: 0, min: 0 },
    scannedAt: { type: Date, default: Date.now }
});

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        bio: {
            type: String,
            maxlength: 500,
            default: ''
        },
        profilePicture: {
            type: String,
            default: ''
        },
        university: {
            type: String,
            required: true,
            trim: true
        },
        faculty: {
            type: String,
            required: true,
            trim: true
        },
        verified: {
            type: Boolean,
            default: false
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'superadmin'],
            default: 'user'
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true
        },
        points: {
            type: Number,
            default: 0,
            min: 0
        },
        totalScans: {
            type: Number,
            default: 0,
            min: 0
        },
        fcmToken: {
            type: String,
            default: ''
        },
    scannedProducts: [ProductSchema],
    posts: [PostSchema],
    redeems: [{ type: Schema.Types.ObjectId, ref: 'Redeem' }]
    },
    {
        timestamps: true
    }
);

UserSchema.index({ university: 1, faculty: 1 });
UserSchema.index({ points: -1 });

export default mongoose.model<IUser>('User', UserSchema);
