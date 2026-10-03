import mongoose, { Schema, Document } from 'mongoose';

export interface ICurrencyRate extends Document {
    code: string; // MXN, COP, USD, EUR, etc.
    name: string; // Peso Mexicano, Peso Colombiano, etc.
    rate: number; // Tasa respecto a USD (1 USD = X moneda)
    isActive: boolean;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CurrencyRateSchema = new Schema<ICurrencyRate>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        rate: {
            type: Number,
            required: true,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        updatedBy: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const CurrencyRateModel = mongoose.model<ICurrencyRate>(
    'CurrencyRate',
    CurrencyRateSchema,
    'currencyrates'
);

export default CurrencyRateModel;
