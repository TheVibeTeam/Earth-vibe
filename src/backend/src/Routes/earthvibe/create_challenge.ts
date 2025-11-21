import { Request, Response } from 'express';
import Challenge from '../../Models/Challenge';

export default {
  name: 'Create Challenge',
  path: '/earthvibe/admin/challenges/create',
  method: 'post',
  category: 'earthvibe',
  example: {
    title: 'Reciclador Diario',
    description: 'Escanea 5 botellas en un día',
    type: 'daily',
    icon: 'recycling',
    targetValue: 5,
    rewardPoints: 50,
  },
  parameter: [],
  premium: false,
  error: false,
  logger: true,
  execution: async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        type,
        icon,
        targetValue,
        rewardPoints,
        expiresAt,
      } = req.body;

      // Validaciones
      if (!title || !description || !type || !icon || !targetValue || !rewardPoints) {
        return res.status(400).json({
          status: false,
          msg: 'Faltan campos requeridos',
        });
      }

      if (!['daily', 'weekly', 'monthly', 'special'].includes(type)) {
        return res.status(400).json({
          status: false,
          msg: 'Tipo de reto inválido',
        });
      }

      // Crear el reto
      const challenge = new Challenge({
        title,
        description,
        type,
        icon,
        targetValue: Number(targetValue),
        rewardPoints: Number(rewardPoints),
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isActive: true,
      });

      await challenge.save();

      return res.status(201).json({
        status: true,
        data: challenge,
        msg: 'Reto creado correctamente',
      });
    } catch (error: any) {
      console.error('Error en createChallenge:', error);
      return res.status(500).json({
        status: false,
        msg: 'Error al crear el reto',
        error: error.message,
      });
    }
  }
};

