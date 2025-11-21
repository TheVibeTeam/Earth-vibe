import type { Request, Response } from 'express';
import QRCode from 'qrcode';

export default {
    name: 'Generate Bottle QR',
    path: '/utils/qr/generate-simple',
    method: 'post',
    category: 'utils',
    example: { 
        bottles: [
            {
                barcode: '7501055363322',
                productName: 'Agua Cielo',
                brand: 'Aje',
                quantity: '500ml'
            },
            {
                barcode: '7501055363323',
                productName: 'Coca-Cola',
                brand: 'Coca-Cola Company',
                quantity: '600ml'
            }
        ]
    },
    parameter: ['bottles', 'secretKey'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        const { bottles, secretKey } = req.body;
        if (!bottles || !Array.isArray(bottles) || bottles.length === 0) {
            return res.status(400).json({ 
                status: false, 
                msg: 'bottles (array) es requerido' 
            });
        }
        for (const bottle of bottles) {
            if (!bottle.barcode || !bottle.productName || !bottle.brand || !bottle.quantity) {
                return res.status(400).json({
                    status: false,
                    msg: 'Cada botella debe tener: barcode, productName, brand, quantity'
                });
            }
        }
        if (!secretKey || typeof secretKey !== 'string') {
            return res.status(400).json({
                status: false,
                msg: 'secretKey es requerido y debe ser string'
            });
        }
        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { bottles, secretKey } = req.body;
            const points = 10;
            const data = {
                type: 'earthvibe_bottle',
                version: '1.0',
                bottles: bottles.map((bottle: any) => ({
                    barcode: bottle.barcode,
                    productName: bottle.productName,
                    brand: bottle.brand,
                    quantity: bottle.quantity,
                    points
                }))
            };

            const json = JSON.stringify(data);

            const crypto = require('crypto');
            let keyStr = secretKey;
            if (keyStr.length < 32) {
                keyStr = keyStr.padEnd(32, '0');
            } else if (keyStr.length > 32) {
                keyStr = keyStr.slice(0, 32);
            }
            const key = Buffer.from(keyStr, 'utf8');
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
            let encrypted = cipher.update(json, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            const authTag = cipher.getAuthTag().toString('base64');
            const qrString = `EVTEAM:${iv.toString('base64')}:${authTag}:${encrypted}`;

            try {
                const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
                decipher.setAuthTag(Buffer.from(authTag, 'base64'));
                let decrypted = decipher.update(encrypted, 'base64', 'utf8');
                decrypted += decipher.final('utf8');
                JSON.parse(decrypted);
            } catch (err) {
                return res.status(400).json({
                    status: false,
                    msg: 'La clave no es válida para encriptar/desencriptar',
                    error: err instanceof Error ? err.message : String(err)
                });
            }

            const buffer = await QRCode.toBuffer(qrString, {
                errorCorrectionLevel: 'M',
                type: 'png',
                width: 300,
                margin: 1
            });

            res.setHeader('Content-Type', 'image/png');
            res.send(buffer);
        } catch (error: any) {
            res.status(500).json({
                status: false,
                msg: 'Error al generar QR',
                error: error.message
            });
        }
    }
};
