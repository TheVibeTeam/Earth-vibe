import type { Request, Response } from 'express';
import UserModel from '../../Models/User';
import { authenticate, requireAdmin, AuthRequest } from '../../Middleware/auth';

export default {
    name: 'Admin - Update User',
    path: '/admin/users/:userId',
    method: 'put',
    category: 'admin',
    example: {
        verified: true,
        points: 100,
        role: 'admin'
    },
    parameter: ['userId'],
    premium: false,
    error: false,
    logger: true,
    requires: [authenticate, requireAdmin],
    execution: async (req: AuthRequest, res: Response) => {
        try {
            const { userId } = req.params;
            const updates = req.body;

            // Campos permitidos para actualizar
            const allowedUpdates = [
                'name',
                'bio',
                'university',
                'faculty',
                'verified',
                'points',
                'role',
                'totalScans'
            ];

            // Filtrar solo campos permitidos
            const filteredUpdates: any = {};
            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    filteredUpdates[key] = updates[key];
                }
            });

            // Validar rol si se está actualizando
            if (filteredUpdates.role) {
                const validRoles = ['user', 'admin', 'superadmin'];
                if (!validRoles.includes(filteredUpdates.role)) {
                    return res.status(400).json({
                        status: false,
                        msg: 'Rol inválido. Debe ser: user, admin o superadmin'
                    });
                }

                // Solo superadmin puede asignar rol superadmin
                if (filteredUpdates.role === 'superadmin' && req.user?.role !== 'superadmin') {
                    return res.status(403).json({
                        status: false,
                        msg: 'Solo un super administrador puede asignar el rol de super administrador'
                    });
                }
            }

            const user = await UserModel.findByIdAndUpdate(
                userId,
                { $set: filteredUpdates },
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({
                    status: false,
                    msg: 'Usuario no encontrado'
                });
            }

            res.json({
                status: true,
                msg: 'Usuario actualizado exitosamente',
                data: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    name: user.name,
                    bio: user.bio,
                    university: user.university,
                    faculty: user.faculty,
                    verified: user.verified,
                    role: user.role,
                    points: user.points
                }
            });
        } catch (error: any) {
            res.status(500).json({
                status: false,
                msg: 'Error al actualizar usuario',
                error: error.message
            });
        }
    }
};
