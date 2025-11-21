import { Request, Response } from 'express';
import Challenge from '../../Models/Challenge';
import { authenticate, requireAdmin, AuthRequest } from '../../Middleware/auth';

export default {
  name: 'Delete Challenge',
  path: '/earthvibe/admin/challenges/delete/:id',
  method: 'delete',
  category: 'earthvibe',
  example: {},
  parameter: [],
  premium: false,
  error: false,
  logger: true,
  requires: [authenticate, requireAdmin],
  execution: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const challenge = await Challenge.findByIdAndDelete(id);

      if (!challenge) {
        return res.status(404).json({ status: false, msg: 'Reto no encontrado' });
      }

      return res.status(200).json({ status: true, msg: 'Reto eliminado correctamente' });
    } catch (error) {
      return res.status(500).json({ status: false, msg: 'Error al eliminar reto', error });
    }
  }
};
