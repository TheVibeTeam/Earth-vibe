import { Request, Response } from 'express';
import UserChallenge from '../../Models/UserChallenge';
import Challenge from '../../Models/Challenge';
import User from '../../Models/User';

export default {
  name: 'Claim Challenge Reward',
  path: '/earthvibe/challenges/claim',
  method: 'post',
  category: 'earthvibe',
  example: { userId: '507f1f77bcf86cd799439011', challengeId: '507f1f77bcf86cd799439012' },
  parameter: [],
  premium: false,
  error: false,
  logger: true,
  execution: async (req: Request, res: Response) => {
    try {
      const { userId, challengeId } = req.body;

      if (!userId || !challengeId) {
        return res.status(400).json({
          status: false,
          msg: 'userId y challengeId son requeridos',
        });
      }

      // Buscar el progreso del usuario en el reto
      const userChallenge = await UserChallenge.findOne({
        userId,
        challengeId,
      });

      if (!userChallenge) {
        return res.status(404).json({
          status: false,
          msg: 'Reto no encontrado para este usuario',
        });
      }

      if (!userChallenge.isCompleted) {
        return res.status(400).json({
          status: false,
          msg: 'El reto no está completado',
        });
      }

      if (userChallenge.claimedReward) {
        return res.status(400).json({
          status: false,
          msg: 'La recompensa ya fue reclamada',
        });
      }

      // Obtener el reto para saber los puntos de recompensa
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        return res.status(404).json({
          status: false,
          msg: 'Reto no encontrado',
        });
      }

      // Actualizar los puntos del usuario
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: false,
          msg: 'Usuario no encontrado',
        });
      }

      user.points = (user.points || 0) + challenge.rewardPoints;
      await user.save();

      // Marcar la recompensa como reclamada
      userChallenge.claimedReward = true;
      await userChallenge.save();

      return res.status(200).json({
        status: true,
        data: {
          newPoints: user.points,
          rewardPoints: challenge.rewardPoints,
        },
        msg: `¡Recompensa reclamada! +${challenge.rewardPoints} puntos`,
      });
    } catch (error: any) {
      console.error('Error en claimChallengeReward:', error);
      return res.status(500).json({
        status: false,
        msg: 'Error al reclamar la recompensa',
        error: error.message,
      });
    }
  }
};

