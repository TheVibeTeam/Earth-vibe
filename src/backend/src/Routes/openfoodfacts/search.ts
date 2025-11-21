import type { Request, Response } from 'express';
import OpenFoodFacts from '../../Utils/scrapper/openfoodfacts';

export default {
    name: 'Search',
    path: '/openfoodfacts/search',
    method: 'get',
    category: 'openfoodfacts',
    example: { query: 'Inca Kola', page: '1', size: '10' },
    parameter: ['query'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        if (!req.query.query) {
            return res.json({ status: false, msg: 'El término de búsqueda es requerido' });
        }
        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { query, page = '1', size = '20' } = req.query;
            const result = await OpenFoodFacts.search(
                query as string,
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
