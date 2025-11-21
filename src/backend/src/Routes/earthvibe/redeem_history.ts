import type { Request, Response } from 'express';
import Redeem from '../../Models/Redeem';
import Reward from '../../Models/Reward';

export default {
  name: 'Redeem History',
  path: '/earthvibe/reward/history',
  method: 'get',
  category: 'earthvibe',
  example: {},
  parameter: [],
  premium: false,
  error: false,
  logger: true,
  requires: (req: Request, res: Response, next: Function) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ status: false, msg: 'Token no proporcionado' });
    }
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
      (req as any).user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ status: false, msg: 'Token inválido o expirado' });
    }
  },
  execution: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const history = await Redeem.find({ userId }).populate('rewardId');
      res.json({ status: true, data: history });
    } catch (error) {
      res.status(500).json({ status: false, msg: 'Error en el servidor', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
};
