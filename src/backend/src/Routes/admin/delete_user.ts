import type { Request, Response } from 'express';
import UserModel from '../../Models/User';
import { authenticate, requireSuperAdmin, AuthRequest } from '../../Middleware/auth';

export default {
    name: 'Admin - Delete User',
    path: '/admin/users/:userId',
    method: 'delete',
    category: 'admin',
    example: {},
    parameter: ['userId'],
    premium: false,
    error: false,
    logger: true,
    requires: [authenticate, requireSuperAdmin],
    execution: async (req: AuthRequest, res: Response) => {
        try {
            const { userId } = req.params;

            // No permitir eliminar a sí mismo
            if (userId === req.user?.userId) {
                return res.status(400).json({
                    status: false,
                    msg: 'No puedes eliminar tu propia cuenta desde el panel de administración'
                });
            }

            const user = await UserModel.findByIdAndDelete(userId);

            if (!user) {
                return res.status(404).json({
                    status: false,
                    msg: 'Usuario no encontrado'
                });
            }

            res.json({
                status: true,
                msg: 'Usuario eliminado exitosamente',
                data: {
                    deletedUser: {
                        id: user._id,
                        username: user.username,
                        email: user.email
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                status: false,
                msg: 'Error al eliminar usuario',
                error: error.message
            });
        }
    }
};
