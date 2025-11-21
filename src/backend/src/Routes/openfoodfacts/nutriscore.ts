import type { Request, Response } from 'express';
import OpenFoodFacts from '../../Utils/scrapper/openfoodfacts';

export default {
    name: 'Nutriscore',
    path: '/openfoodfacts/nutriscore',
    method: 'get',
    category: 'openfoodfacts',
    example: { country: 'peru', grade: 'a', page: '1', size: '10' },
    parameter: ['country', 'grade'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        if (!req.query.country || !req.query.grade) {
            return res.json({ status: false, msg: 'El país y grado nutriscore son requeridos' });
        }
        next();
    },
    validator: (req: Request, res: Response, next: Function) => {
        const validGrades = ['a', 'b', 'c', 'd', 'e'];
        const grade = (req.query.grade as string).toLowerCase();
        if (!validGrades.includes(grade)) {
            return res.json({ 
                status: false, 
                msg: 'El grado debe ser a, b, c, d o e' 
            });
        }
        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { country, grade, page = '1', size = '20' } = req.query;
            const result = await OpenFoodFacts.nutriscore(
                country as string,
                (grade as string).toLowerCase(),
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
