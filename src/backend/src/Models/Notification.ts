import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    title: string;
    message: string;
    type: 'general' | 'announcement' | 'alert' | 'update';
    priority: 'low' | 'medium' | 'high';
    sentBy: mongoose.Types.ObjectId; // Admin que envió la notificación
    sentByName: string;
    recipients: 'all' | 'verified' | 'specific'; // A quién se envía
    specificUsers?: mongoose.Types.ObjectId[]; // Si es específico
    readBy: mongoose.Types.ObjectId[]; // Usuarios que la leyeron
    createdAt: Date;
    expiresAt?: Date; // Opcional: fecha de expiración
}

const NotificationSchema = new Schema<INotification>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },
        type: {
            type: String,
            enum: ['general', 'announcement', 'alert', 'update'],
            default: 'general'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        sentBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        sentByName: {
            type: String,
            required: true
        },
        recipients: {
            type: String,
            enum: ['all', 'verified', 'specific'],
            default: 'all'
        },
        specificUsers: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        readBy: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        expiresAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

// Índices para mejorar el rendimiento
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ recipients: 1 });
NotificationSchema.index({ expiresAt: 1 });

const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel;
