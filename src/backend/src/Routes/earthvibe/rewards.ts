import type { Request, Response } from 'express';
import Reward from '../../Models/Reward';

export default {
    name: 'Get Rewards',
    path: '/earthvibe/rewards',
    method: 'get',
    category: 'earthvibe',
    example: {},
    parameter: [],
    premium: false,
    error: false,
    logger: true,
    execution: async (req: Request, res: Response) => {
        try {
            const rewards = await Reward.find({ available: true });
            res.json({
                status: true,
                data: rewards,
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
};
