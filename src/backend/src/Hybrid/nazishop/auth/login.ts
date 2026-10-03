import logger from '../../../Utils/logger';
import NaziShopUserModel from '../models/NaziShopUser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default {
    name: 'Login User',
    type: 'mutation',
    description: 'Login user with email and password',
    file: __filename,
    category: 'auth',
    mutation: `login(input: LoginInput!): AuthResponse!`,
    resolver: async (_: any, args: any) => {
        try {
            const { input } = args;
            const { email, password } = input;
            logger.info({ email }, 'User login attempt');
            if (!email || !password) throw new Error('Email y contraseña son requeridos');
            
            const user = await NaziShopUserModel.findOne({ email: email.toLowerCase() });
            
            if (!user) {
                logger.warn({ email }, 'Login failed: User not found');
                throw new Error('Usuario o contraseña incorrectos');
            }
            
            if (!user.isActive) {
                logger.warn({ email }, 'Login failed: User inactive');
                throw new Error('Usuario desactivado');
            }
            
            if (!user.password) {
                logger.warn({ email }, 'Login failed: No password (external auth)');
                throw new Error('Usuario registrado con método externo');
            }

            const validPassword = await bcrypt.compare(password, user.password);
            
            logger.info({
                userId: user._id,
                passwordProvided: password.substring(0, 2) + '...',
                storedHash: user.password.substring(0, 10) + '...',
                isMatch: validPassword
            }, 'Password comparison result');

            if (!validPassword) {
                logger.warn({ email }, 'Login failed: Invalid password');
                throw new Error('Usuario o contraseña incorrectos');
            }

            await NaziShopUserModel.updateOne({ _id: user._id }, { lastActiveTime: new Date() });
            const token = jwt.sign(
                { 
                    id: (user._id as any).toString(), 
                    email: user.email, 
                    role: user.role,
                    displayName: user.displayName
                },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '7d' }
            );
            return {
                success: true,
                message: 'Login exitoso',
                token,
                user: {
                    id: (user._id as any).toString(),
                    email: user.email,
                    displayName: user.displayName,
                    photoUrl: user.photoUrl,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt.toISOString(),
                    totalPurchases: user.totalPurchases,
                    totalSpent: user.totalSpent,
                    favoriteServices: user.favoriteServices
                }
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error during login');
            throw new Error(error.message || 'Error al iniciar sesión');
        }
    }
};
