import type { Request, Response } from 'express';
import QRCode from 'qrcode';
import OpenFoodFacts from '../../Utils/scrapper/openfoodfacts';
import Product from '../../Models/Product';

export default {
    name: 'Generate QR from Barcode',
    path: '/utils/qr/generate-from-barcode/:barcodes',
    method: 'post',
    category: 'utils',
    example: { 
        url: '/utils/qr/generate-from-barcode/7501055363322,7750670244954',
        body: {}
    },
    parameter: ['barcodes'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        const { barcodes } = req.params;
        
        if (!barcodes || typeof barcodes !== 'string' || barcodes.trim() === '') {
            return res.status(400).json({ 
                status: false, 
                msg: 'barcodes es requerido en los parámetros de la URL (separados por comas)' 
            });
        }
        
        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { barcodes: barcodesParam } = req.params;
            
            // Convertir el string de barcodes separados por comas en array
            const barcodes = barcodesParam.split(',').map(b => b.trim()).filter(b => b.length > 0);
            
            if (barcodes.length === 0) {
                return res.status(400).json({
                    status: false,
                    msg: 'Debe proporcionar al menos un código de barras'
                });
            }
            
            const points = 10;
            
            // Obtener datos de productos desde OpenFoodFacts
            const bottlesData = [];
            const errors = [];
            
            for (const barcode of barcodes) {
                try {
                    const result = await OpenFoodFacts.barcode(barcode);
                    
                    if (result.status && result.data) {
                        const productName = result.data.name && result.data.name.trim() !== '' 
                            ? result.data.name 
                            : 'Producto desconocido';
                        
                        let brand = 'Marca desconocida';
                        if (result.data.brand && typeof result.data.brand === 'string' && result.data.brand.trim() !== '') {
                            const brands = result.data.brand.split(',');
                            brand = brands[0].trim();
                        }
                        
                        const quantity = result.data.quantity && result.data.quantity.trim() !== '' 
                            ? result.data.quantity 
                            : 'N/A';
                        
                        // Crear o actualizar el producto en la base de datos
                        try {
                            await Product.findOneAndUpdate(
                                { barcode: barcode },
                                {
                                    barcode: barcode,
                                    productName: productName,
                                    brand: brand,
                                    quantity: quantity,
                                    points: points,
                                    isActive: true,
                                    imageUrl: result.data.thumbnail || ''
                                },
                                { upsert: true, new: true }
                            );
                        } catch (dbError) {
                            console.error(`Error al guardar producto ${barcode}:`, dbError);
                        }
                        
                        bottlesData.push({
                            barcode: barcode,
                            productName: productName,
                            brand: brand,
                            quantity: quantity,
                            points
                        });
                    } else {
                        // Si no se encuentra el producto, usar datos genéricos y crear en BD
                        errors.push({
                            barcode: barcode,
                            error: 'Producto no encontrado en OpenFoodFacts, usando datos genéricos'
                        });
                        
                        const genericData = {
                            barcode: barcode,
                            productName: 'Producto desconocido',
                            brand: 'Marca desconocida',
                            quantity: 'N/A',
                            points
                        };
                        
                        // Crear producto genérico en BD
                        try {
                            await Product.findOneAndUpdate(
                                { barcode: barcode },
                                {
                                    barcode: barcode,
                                    productName: genericData.productName,
                                    brand: genericData.brand,
                                    quantity: genericData.quantity,
                                    points: points,
                                    isActive: true
                                },
                                { upsert: true, new: true }
                            );
                        } catch (dbError) {
                            console.error(`Error al guardar producto genérico ${barcode}:`, dbError);
                        }
                        
                        bottlesData.push(genericData);
                    }
                } catch (error) {
                    // En caso de error, usar datos genéricos
                    errors.push({
                        barcode: barcode,
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                    
                    const genericData = {
                        barcode: barcode,
                        productName: 'Producto desconocido',
                        brand: 'Marca desconocida',
                        quantity: 'N/A',
                        points
                    };
                    
                    // Crear producto genérico en BD
                    try {
                        await Product.findOneAndUpdate(
                            { barcode: barcode },
                            {
                                barcode: barcode,
                                productName: genericData.productName,
                                brand: genericData.brand,
                                quantity: genericData.quantity,
                                points: points,
                                isActive: true
                            },
                            { upsert: true, new: true }
                        );
                    } catch (dbError) {
                        console.error(`Error al guardar producto genérico ${barcode}:`, dbError);
                    }
                    
                    bottlesData.push(genericData);
                }
            }
            
            const data = {
                type: 'earthvibe_bottle',
                version: '1.0',
                bottles: bottlesData
            };

            const json = JSON.stringify(data);

            const crypto = require('crypto');
            // Usar variable de entorno o clave por defecto
            let keyStr = process.env.QR_SECRET_KEY || 'earth-vibe-default-secret-key-2025';
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

            if (errors.length > 0) {
                res.setHeader('X-Scrapper-Warnings', JSON.stringify(errors));
            }

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
