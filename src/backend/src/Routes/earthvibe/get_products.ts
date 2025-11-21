import type { Request, Response } from 'express';
import Product from '../../Models/Product';

export default {
    name: 'Get Products',
    path: '/earthvibe/products',
    method: 'get',
    category: 'earthvibe',
    example: {},
    parameter: [],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { isActive, limit = 100, skip = 0 } = req.query;

            const filter: any = {};
            if (isActive !== undefined) {
                filter.isActive = isActive === 'true';
            }

            const products = await Product.find(filter)
                .limit(Number(limit))
                .skip(Number(skip))
                .sort({ createdAt: -1 });

            const total = await Product.countDocuments(filter);

            res.json({
                status: true,
                data: products,
                total,
                limit: Number(limit),
                skip: Number(skip)
            });
        } catch (error: any) {
            res.status(500).json({
                status: false,
                msg: 'Error al obtener productos',
                error: error.message
            });
        }
    }
};
