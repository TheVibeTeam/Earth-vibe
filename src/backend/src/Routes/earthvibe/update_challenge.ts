import { Request, Response } from 'express';
import Challenge from '../../Models/Challenge';
import { authenticate, requireAdmin, AuthRequest } from '../../Middleware/auth';

export default {
  name: 'Update Challenge',
  path: '/earthvibe/admin/challenges/update/:id',
  method: 'put',
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
  requires: [authenticate, requireAdmin],
  execution: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
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

      const updatedChallenge = await Challenge.findByIdAndUpdate(
        id,
        {
          title,
          description,
          type,
          icon,
          targetValue,
          rewardPoints,
          expiresAt,
        },
        { new: true }
      );

      if (!updatedChallenge) {
        return res.status(404).json({
          status: false,
          msg: 'Reto no encontrado',
        });
      }

      res.json({
        status: true,
        msg: 'Reto actualizado exitosamente',
        data: updatedChallenge,
      });
    } catch (error: any) {
      console.error('Error al actualizar reto:', error);
      res.status(500).json({
        status: false,
        msg: 'Error interno del servidor',
        error: error.message,
      });
    }
  },
};
