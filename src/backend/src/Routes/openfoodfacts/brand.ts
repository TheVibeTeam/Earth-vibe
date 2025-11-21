import type { Request, Response } from 'express';
import OpenFoodFacts from '../../Utils/scrapper/openfoodfacts';

export default {
    name: 'Brand',
    path: '/openfoodfacts/brand',
    method: 'get',
    category: 'openfoodfacts',
    example: { brand: 'gloria', category: 'yogurts', page: '1', size: '10' },
    parameter: ['brand', 'category'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        if (!req.query.brand || !req.query.category) {
            return res.json({ status: false, msg: 'La marca y categoría son requeridas' });
        }
        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { brand, category, page = '1', size = '20' } = req.query;
            const result = await OpenFoodFacts.brand(
                brand as string,
                category as string,
                parseInt(page as string),
                parseInt(size as string)
            );
            res.json(result);
        } catch (error) {
            res.json({
                status: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
