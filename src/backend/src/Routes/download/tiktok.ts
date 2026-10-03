import type { Request, Response } from 'express';
import TikTokScraper from '../../Utils/scrapper/tiktok';

export default {
    name: 'Download TikTok Media',
    path: '/download/tiktok',
    method: 'post',
    category: 'download',
    example: {
        url: '/download/tiktok',
        body: { url: 'https://www.tiktok.com/@user/video/123' }
    },
    parameter: ['url'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        const { url } = req.body;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ status: false, msg: 'La URL es requerida' });
        }
        next();
    },
    execution: async (req: Request, res: Response) => {
        const { url } = req.body;
        try {

            const result = await TikTokScraper.download(url);

            if (!result.status || !result.data) {
                return res.status(404).json({
                    status: false,
                    msg: result.error || 'No se encontró contenido para descargar.'
                });
            }

            return res.status(200).json(result);

        } catch (e) {
            console.error('Error en descarga de TikTok:', e);
            return res.status(500).json({ status: false, msg: 'Error interno del servidor.' });
        }
    }
};