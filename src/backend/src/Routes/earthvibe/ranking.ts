import type { Request, Response } from 'express';
import UserModel from '../../Models/User';

export default {
    name: 'Get Ranking',
    path: '/earthvibe/ranking',
    method: 'get',
    category: 'earthvibe',
    example: { limit: '10' },
    parameter: [],
    premium: false,
    error: false,
    logger: true,
    execution: async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            const users = await UserModel
                .find()
                .select('username name university faculty points scannedProducts profilePicture verified')
                .sort({ points: -1 })
                .limit(limit);

            const ranking = users.map((user, index) => ({
                rank: index + 1,
                id: user._id,
                username: user.username,
                name: user.name,
                university: user.university,
                faculty: user.faculty,
                points: user.points,
                totalScans: user.scannedProducts.length,
                profilePicture: user.profilePicture,
                verified: user.verified
            }));

            res.json({
                status: true,
                data: ranking,
                total: ranking.length
            });
        } catch (error) {
            console.error('Error obteniendo ranking:', error);
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
