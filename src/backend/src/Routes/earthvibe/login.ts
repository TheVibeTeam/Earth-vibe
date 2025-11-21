import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '30d';

export default {
    name: 'Login',
    path: '/earthvibe/authentication/login',
    method: 'post',
    category: 'earthvibe',
    example: { 
        email: 'student@university.edu', 
        password: 'password123' 
    },
    parameter: ['email', 'password'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                status: false, 
                msg: 'Email y contraseña son requeridos' 
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                status: false, 
                msg: 'Email inválido' 
            });
        }

        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            // Buscar usuario en la base de datos
            const user = await UserModel.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(401).json({
                    status: false,
                    msg: 'Credenciales inválidas'
                });
            }

            // Verificar contraseña
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                return res.status(401).json({
                    status: false,
                    msg: 'Credenciales inválidas'
                });
            }

            // Generar JWT token
            const token = jwt.sign(
                { 
                    userId: user._id, 
                    email: user.email,
                    username: user.username,
                    role: user.role || 'user'
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            res.json({
                status: true,
                msg: 'Inicio de sesión exitoso',
                data: {
                    token,
                    user: {
                        id: user._id,
                        email: user.email,
                        username: user.username,
                        name: user.name,
                        bio: user.bio,
                        profilePicture: user.profilePicture,
                        university: user.university,
                        faculty: user.faculty,
                        verified: user.verified,
                        role: user.role || 'user',
                        points: user.points,
                        totalScans: user.scannedProducts.length,
                        totalPosts: user.posts.length,
                        createdAt: user.createdAt
                    }
                }
            });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
