import logger from '../../../Utils/logger';
import NaziShopUserModel from '../models/NaziShopUser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default {
    name: 'Register User',
    type: 'mutation',
    description: 'Register a new user',
    file: __filename,
    category: 'auth',
    mutation: `register(input: RegisterInput!): AuthResponse!`,
    resolver: async (_: any, args: any) => {
        try {
            const { input } = args;
            const { email, password, displayName, phoneNumber } = input;
            logger.info({ email }, 'Registering new user');
            if (!email || !password) throw new Error('Email y contraseña son requeridos');
            const existingUser = await NaziShopUserModel.findOne({ email: email.toLowerCase() });
            if (existingUser) throw new Error('El email ya está registrado');
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await NaziShopUserModel.create({
                email: email.toLowerCase(),
                password: hashedPassword,
                displayName: displayName || email.split('@')[0],
                phoneNumber,
                role: 'USER',
                isActive: true,
                totalPurchases: 0,
                totalSpent: 0,
                favoriteServices: []
            });
            const token = jwt.sign(
                { 
                    id: (newUser._id as any).toString(), 
                    email: newUser.email, 
                    role: newUser.role,
                    displayName: newUser.displayName
                },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '7d' }
            );
            return {
                success: true,
                message: 'Usuario registrado exitosamente',
                token,
                user: {
                    id: (newUser._id as any).toString(),
                    email: newUser.email,
                    displayName: newUser.displayName,
                    photoUrl: newUser.photoUrl,
                    phoneNumber: newUser.phoneNumber,
                    role: newUser.role,
                    isActive: newUser.isActive,
                    createdAt: newUser.createdAt.toISOString(),
                    totalPurchases: newUser.totalPurchases,
                    totalSpent: newUser.totalSpent,
                    favoriteServices: newUser.favoriteServices
                }
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error registering user');
            throw new Error(error.message || 'Error al registrar usuario');
        }
    }
};
