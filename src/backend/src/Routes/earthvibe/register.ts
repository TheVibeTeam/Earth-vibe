import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '30d';
const SALT_ROUNDS = 10;

export default {
    name: 'Register',
    path: '/earthvibe/authentication/register',
    method: 'post',
    category: 'earthvibe',
    example: { 
        email: 'student@university.edu', 
        password: 'password123',
        username: 'johndoe',
        name: 'John Doe',
        university: 'Universidad Nacional',
        faculty: 'Ingeniería de Sistemas',
        bio: 'Estudiante apasionado por la sostenibilidad'
    },
    parameter: ['email', 'password', 'username', 'name', 'university', 'faculty'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        const { email, password, username, name, university, faculty } = req.body;
        
        if (!email || !password || !username || !name || !university || !faculty) {
            return res.status(400).json({ 
                status: false, 
                msg: 'Todos los campos son requeridos (email, password, username, name, university, faculty)' 
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

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({ 
                status: false, 
                msg: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }

        // Validar username
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ 
                status: false, 
                msg: 'El nombre de usuario debe tener entre 3-30 caracteres y solo puede contener letras, números y guiones bajos' 
            });
        }

        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { email, password, username, name, university, faculty, bio } = req.body;

            // Verificar si el email ya existe
            const existingEmail = await UserModel.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(409).json({
                    status: false,
                    msg: 'El email ya está registrado'
                });
            }

            // Verificar si el username ya existe
            const existingUsername = await UserModel.findOne({ username: username.toLowerCase() });
            if (existingUsername) {
                return res.status(409).json({
                    status: false,
                    msg: 'El nombre de usuario ya está en uso'
                });
            }

            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            // Crear nuevo usuario
            const newUser = await UserModel.create({
                email: email.toLowerCase(),
                password: hashedPassword,
                username: username.toLowerCase(),
                name: name.trim(),
                bio: bio?.trim() || '',
                university: university.trim(),
                faculty: faculty.trim(),
                points: 0,
                scannedProducts: [],
                posts: []
            });

            // Generar JWT token
            const token = jwt.sign(
                { 
                    userId: newUser._id, 
                    email: newUser.email,
                    username: newUser.username,
                    role: newUser.role || 'user'
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            res.status(201).json({
                status: true,
                msg: 'Usuario registrado exitosamente',
                data: {
                    token,
                    user: {
                        id: newUser._id,
                        email: newUser.email,
                        username: newUser.username,
                        name: newUser.name,
                        bio: newUser.bio,
                        profilePicture: newUser.profilePicture,
                        university: newUser.university,
                        faculty: newUser.faculty,
                        verified: newUser.verified,
                        role: newUser.role || 'user',
                        points: newUser.points,
                        totalScans: 0,
                        totalPosts: 0,
                        createdAt: newUser.createdAt
                    }
                }
            });
        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
