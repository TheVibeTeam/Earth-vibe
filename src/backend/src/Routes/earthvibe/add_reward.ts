import type { Request, Response } from 'express';
import Reward from '../../Models/Reward';
import Storage from '../../Utils/storage';
import { authenticate, requireAdmin, AuthRequest } from '../../Middleware/auth';

export default {
    name: 'Add Reward',
    path: '/earthvibe/reward/add',
    method: 'post',
    category: 'earthvibe',
    example: { name: 'Ayuda en asignatura', description: '...', points: 1000, category: 'Academico', imageUrl: '...' },
    parameter: ['name', 'description', 'points', 'category', 'imageUrl'],
    premium: true,
    error: false,
    logger: true,
    requires: [authenticate, requireAdmin],
    execution: async (req: AuthRequest, res: Response) => {
        try {
            let { name, description, points, category, imageUrl } = req.body;
            if (!name || !description || !points || !category) {
                return res.status(400).json({ status: false, msg: 'Faltan datos requeridos' });
            }

            // Procesar imagen si es base64
            if (imageUrl && imageUrl.startsWith('data:image')) {
                try {
                    const uploadResult = await Storage.uploadBase64(imageUrl, {
                        userId: req.user!.userId,
                        category: 'rewards',
                        originalName: `reward_${Date.now()}`
                    });
                    imageUrl = uploadResult.url;
                } catch (error) {
                    return res.status(400).json({
                        status: false,
                        msg: 'Error al subir la imagen'
                    });
                }
            }

            const reward = await Reward.create({ name, description, points, category, imageUrl });
            res.json({ status: true, msg: 'Premio creado', data: reward });
        } catch (error) {
            res.status(500).json({ status: false, msg: 'Error en el servidor', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
};
