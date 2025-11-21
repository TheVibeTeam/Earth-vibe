import type { Request, Response } from 'express';
import OpenFoodFacts from '../../Utils/scrapper/openfoodfacts';

export default {
    name: 'Barcode',
    path: '/openfoodfacts/barcode',
    method: 'get',
    category: 'openfoodfacts',
    example: { code: '7750670244954' },
    parameter: ['code'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        if (!req.query.code) {
            return res.json({ status: false, msg: 'El código de barras es requerido' });
        }
        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { code } = req.query;
            const result = await OpenFoodFacts.barcode(code as string);
            res.json(result);
        } catch (error) {
            res.json({
                status: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
