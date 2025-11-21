import type { Request, Response } from 'express';
import Reward from '../../Models/Reward';
import Redeem from '../../Models/Redeem';
import User from '../../Models/User';

export default {
    name: 'Redeem Reward',
    path: '/earthvibe/reward/redeem',
    method: 'post',
    category: 'earthvibe',
    example: { rewardId: 'id' },
    parameter: ['rewardId'],
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
            const { rewardId } = req.body;
            const userId = (req as any).user.userId;
            const user = await User.findById(userId);
            const reward = await Reward.findById(rewardId);
            if (!user || !reward) {
                return res.status(404).json({ status: false, msg: 'Usuario o premio no encontrado' });
            }
            if (user.points < reward.points) {
                return res.status(400).json({ status: false, msg: 'No tienes suficientes puntos para canjear este premio' });
            }
            user.points -= reward.points;
            await user.save();
            const redeem = await Redeem.create({
                userId,
                rewardId,
                status: 'pending',
                message: 'Canje en proceso',
            });
            user.redeems.push(redeem._id as any);
            await user.save();
            res.json({ status: true, msg: 'Canje realizado, espera confirmación', data: redeem });
        } catch (error) {
            res.status(500).json({ status: false, msg: 'Error en el servidor', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
};
