import { Request, Response } from 'express';
import Challenge from '../../Models/Challenge';
import UserChallenge from '../../Models/UserChallenge';
import User from '../../Models/User';

export default {
  name: 'Get Challenges',
  path: '/earthvibe/challenges',
  method: 'get',
  category: 'earthvibe',
  example: { userId: '507f1f77bcf86cd799439011' },
  parameter: [],
  premium: false,
  error: false,
  logger: true,
  execution: async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({
          status: false,
          msg: 'userId es requerido',
        });
      }

      // Verificar que el usuario existe
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: false,
          msg: 'Usuario no encontrado',
        });
      }

      // Obtener todos los retos activos
      const now = new Date();
      const challenges = await Challenge.find({
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gte: now } }
        ]
      }).sort({ type: 1, createdAt: -1 });

      // Obtener el progreso del usuario para cada reto
      const challengesWithProgress = await Promise.all(
        challenges.map(async (challenge) => {
          const userChallenge = await UserChallenge.findOne({
            userId,
            challengeId: challenge._id,
          });

          return {
            id: challenge._id,
            title: challenge.title,
            description: challenge.description,
            type: challenge.type,
            icon: challenge.icon,
            targetValue: challenge.targetValue,
            rewardPoints: challenge.rewardPoints,
            expiresAt: challenge.expiresAt,
            progress: userChallenge?.progress || 0,
            isCompleted: userChallenge?.isCompleted || false,
            claimedReward: userChallenge?.claimedReward || false,
            completedAt: userChallenge?.completedAt,
          };
        })
      );

      return res.status(200).json({
        status: true,
        data: challengesWithProgress,
        msg: 'Retos obtenidos correctamente',
      });
    } catch (error: any) {
      console.error('Error en getChallenges:', error);
      return res.status(500).json({
        status: false,
        msg: 'Error al obtener los retos',
        error: error.message,
      });
    }
  }
};

