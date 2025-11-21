import type { Request, Response } from 'express';
import OpenFoodFacts from '../../Utils/scrapper/openfoodfacts';

export default {
    name: 'Label',
    path: '/openfoodfacts/label',
    method: 'get',
    category: 'openfoodfacts',
    example: { name: 'vegan', page: '1', size: '10' },
    parameter: ['name'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        if (!req.query.name) {
            return res.json({ status: false, msg: 'El nombre de la etiqueta es requerido' });
        }
        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { name, page = '1', size = '20' } = req.query;
            const result = await OpenFoodFacts.label(
                name as string,
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
