import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';
import OpenFoodFacts from '../../Utils/scrapper/openfoodfacts';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Función para calcular puntos según el producto
const calculatePoints = (product: any): number => {
    let points = 10; // Puntos base por escanear

    // Puntos por nutriscore
    if (product.nutriScore) {
        const nutriScorePoints: { [key: string]: number } = {
            'a': 50,
            'b': 40,
            'c': 30,
            'd': 20,
            'e': 10
        };
        points += nutriScorePoints[product.nutriScore.toLowerCase()] || 0;
    }

    // Puntos por nova group (menos procesado = más puntos)
    if (product.novaGroup) {
        const novaPoints: { [key: number]: number } = {
            1: 40, // Alimentos no procesados
            2: 30, // Ingredientes culinarios procesados
            3: 20, // Alimentos procesados
            4: 10  // Alimentos ultraprocesados
        };
        points += novaPoints[product.novaGroup] || 0;
    }

    // Puntos si tiene etiquetas ecológicas
    if (product.labels) {
        const ecoLabels = ['organic', 'bio', 'ecological', 'ecologico', 'organico'];
        const hasEcoLabel = ecoLabels.some(label => 
            product.labels.toLowerCase().includes(label)
        );
        if (hasEcoLabel) points += 30;
    }

    return points;
};

export default {
    name: 'Scan Product',
    path: '/earthvibe/product/scan',
    method: 'post',
    category: 'earthvibe',
    example: { 
        barcode: '7750670244954'
    },
    parameter: ['barcode'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                status: false, 
                msg: 'Token no proporcionado' 
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            (req as any).user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ 
                status: false, 
                msg: 'Token inválido o expirado' 
            });
        }

        if (!req.body.barcode) {
            return res.status(400).json({ 
                status: false, 
                msg: 'El código de barras es requerido' 
            });
        }
    },
    execution: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { barcode } = req.body;

            // Buscar producto en OpenFoodFacts
            const productData = await OpenFoodFacts.barcode(barcode);

            if (!productData.status || !productData.data) {
                return res.status(404).json({
                    status: false,
                    msg: 'Producto no encontrado'
                });
            }

            const product = productData.data;

            // Verificar que sea una botella (plástico reciclable)
            const isBottle = product.categories?.toLowerCase().includes('bottle') ||
                           product.categories?.toLowerCase().includes('botella') ||
                           product.packaging?.toLowerCase().includes('bottle') ||
                           product.packaging?.toLowerCase().includes('botella') ||
                           product.packaging?.toLowerCase().includes('plastic');

            if (!isBottle) {
                return res.status(400).json({
                    status: false,
                    msg: 'Solo se pueden escanear botellas plásticas reciclables'
                });
            }

            // Verificar si el producto ya fue escaneado por el usuario
            const currentUser = await UserModel.findById(user.userId);
            if (!currentUser) {
                return res.status(404).json({
                    status: false,
                    msg: 'Usuario no encontrado'
                });
            }

            const alreadyScanned = currentUser.scannedProducts.some(
                p => p.barcode === barcode
            );

            // Calcular puntos
            const points = calculatePoints(product);
            const bonusPoints = alreadyScanned ? 0 : 50; // Bonus por primera vez
            const totalPoints = points + bonusPoints;

            // Agregar producto escaneado
            currentUser.scannedProducts.push({
                barcode: product.barcode,
                productName: product.name || 'Producto sin nombre',
                brand: product.brand || 'Marca desconocida',
                quantity: product.quantity || 'Sin información',
                points: totalPoints,
                scannedAt: new Date()
            });

            // Actualizar puntos totales del usuario
            currentUser.points += totalPoints;

            await currentUser.save();

            res.json({
                status: true,
                msg: alreadyScanned 
                    ? 'Producto escaneado nuevamente' 
                    : '¡Primera vez escaneando este producto!',
                data: {
                    product: {
                        barcode: product.barcode,
                        name: product.name,
                        brand: product.brand,
                        quantity: product.quantity,
                        thumbnail: product.thumbnail,
                        nutriScore: product.nutriScore,
                        novaGroup: product.novaGroup
                    },
                    points: {
                        earned: totalPoints,
                        base: points,
                        bonus: bonusPoints,
                        total: currentUser.points
                    },
                    isFirstScan: !alreadyScanned
                }
            });
        } catch (error) {
            console.error('Error en scan:', error);
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
