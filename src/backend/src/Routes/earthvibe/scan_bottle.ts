import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';
import Challenge from '../../Models/Challenge';
import UserChallenge from '../../Models/UserChallenge';
import Product from '../../Models/Product';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Scan Bottle',
    path: '/earthvibe/scan-bottle',
    method: 'post',
    category: 'earthvibe',
    example: { 
        userId: '507f1f77bcf86cd799439011',
        bottles: [
            {
                barcode: '7501055363322',
                productName: 'Agua Cielo',
                brand: 'Aje',
                quantity: '500ml',
                points: 10
            },
            {
                barcode: '7501055363323',
                productName: 'Coca-Cola',
                brand: 'Coca-Cola Company',
                quantity: '600ml',
                points: 10
            }
        ]
    },
    parameter: ['userId', 'bottles'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                status: false, 
                msg: 'Token de autenticación no proporcionado' 
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            (req as any).user = decoded;
        } catch (error) {
            return res.status(401).json({ 
                status: false, 
                msg: 'Token inválido o expirado' 
            });
        }

        const { userId, bottles } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                status: false, 
                msg: 'userId es requerido' 
            });
        }

        const authenticatedUserId = (req as any).user.userId;
        if (userId !== authenticatedUserId) {
            return res.status(403).json({
                status: false,
                msg: 'No tienes permiso para registrar botellas a otro usuario'
            });
        }

        if (!bottles) {
            return res.status(400).json({ 
                status: false, 
                msg: 'bottles es requerido. Asegúrate de parsear correctamente el QR' 
            });
        }

        if (!Array.isArray(bottles)) {
            return res.status(400).json({ 
                status: false, 
                msg: 'bottles debe ser un array. El QR escaneado no tiene el formato correcto' 
            });
        }

        if (bottles.length === 0) {
            return res.status(400).json({ 
                status: false, 
                msg: 'bottles está vacío' 
            });
        }

        for (let i = 0; i < bottles.length; i++) {
            const bottle = bottles[i];
            if (!bottle.barcode || !bottle.productName || !bottle.brand || !bottle.quantity || typeof bottle.points !== 'number') {
                return res.status(400).json({
                    status: false,
                    msg: `Botella en posición ${i} no tiene el formato correcto. Campos requeridos: barcode, productName, brand, quantity, points`
                });
            }
        }

        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const { userId, bottles } = req.body;

            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    msg: 'Usuario no encontrado'
                });
            }

            const skipped: any[] = [];
            const added: any[] = [];
            const notFound: any[] = [];
            let total = 0;

            // Verificar cada botella
            for (const bottle of bottles) {
                // Verificar si la botella existe en la base de datos de productos
                const product = await Product.findOne({ 
                    barcode: bottle.barcode,
                    isActive: true 
                });

                if (!product) {
                    notFound.push({
                        barcode: bottle.barcode,
                        productName: bottle.productName,
                        reason: 'Producto no encontrado en la base de datos'
                    });
                    continue;
                }

                // Verificar si el usuario ya escaneó este código de barras
                const alreadyScanned = user.scannedProducts.find(
                    p => p.barcode === bottle.barcode
                );

                if (alreadyScanned) {
                    // La botella ya fue escaneada, no la guardamos nuevamente
                    skipped.push({
                        barcode: bottle.barcode,
                        productName: product.productName,
                        brand: product.brand,
                        scannedAt: alreadyScanned.scannedAt,
                        message: 'Esta botella ya fue registrada anteriormente'
                    });
                    continue;
                }

                // Agregar la botella usando los datos del producto de la BD
                const item = {
                    barcode: product.barcode,
                    productName: product.productName,
                    brand: product.brand,
                    quantity: product.quantity || bottle.quantity,
                    points: product.points,
                    scannedAt: new Date()
                };

                user.scannedProducts.push(item);
                added.push(item);
                total += product.points;
            }

            // Si hay botellas procesadas (nuevas o ya escaneadas), retornar éxito
            if (added.length === 0 && skipped.length > 0) {
                // Todas las botellas ya fueron escaneadas
                return res.json({
                    status: true,
                    msg: 'Todas las botellas ya fueron registradas anteriormente',
                    added: 0,
                    skipped: skipped.length,
                    notFound: notFound.length,
                    invalidProducts: notFound,
                    alreadyScanned: skipped,
                    totalPoints: 0,
                    userTotalPoints: user.points,
                    totalRecycled: user.scannedProducts.length
                });
            }

            // Si no se procesó ninguna botella válida, retornar error
            if (added.length === 0) {
                return res.status(400).json({
                    status: false,
                    msg: 'Ninguna botella válida para registrar',
                    added: 0,
                    skipped: skipped.length,
                    notFound: notFound.length,
                    invalidProducts: notFound,
                    alreadyScanned: skipped
                });
            }

            user.points += total;
            await user.save();

            // Actualizar progreso de retos activos
            const now = new Date();
            const activeChallenges = await Challenge.find({
                isActive: true,
                $or: [
                    { expiresAt: { $exists: false } },
                    { expiresAt: null },
                    { expiresAt: { $gte: now } }
                ]
            });

            const completedChallenges: any[] = [];
            
            for (const challenge of activeChallenges) {
                let userChallenge = await UserChallenge.findOne({
                    userId: user._id,
                    challengeId: challenge._id
                });

                if (!userChallenge) {
                    userChallenge = new UserChallenge({
                        userId: user._id,
                        challengeId: challenge._id,
                        progress: 0,
                        isCompleted: false,
                        claimedReward: false
                    });
                }

                if (!userChallenge.isCompleted) {
                    // Incrementar progreso según el número de botellas nuevas escaneadas
                    userChallenge.progress += added.length;

                    // Verificar si se completó el reto
                    if (userChallenge.progress >= challenge.targetValue) {
                        userChallenge.isCompleted = true;
                        userChallenge.completedAt = new Date();
                        completedChallenges.push({
                            id: challenge._id,
                            title: challenge.title,
                            rewardPoints: challenge.rewardPoints
                        });
                    }

                    await userChallenge.save();
                }
            }

            res.json({
                status: true,
                msg: `${added.length} botella(s) registrada(s) exitosamente`,
                added: added.length,
                skipped: skipped.length,
                notFound: notFound.length,
                invalidProducts: notFound,
                alreadyScanned: skipped,
                totalPoints: total,
                userTotalPoints: user.points,
                totalRecycled: user.scannedProducts.length,
                completedChallenges: completedChallenges
            });
        } catch (error: any) {
            res.status(500).json({
                status: false,
                msg: 'Error al registrar botellas',
                error: error.message
            });
        }
    }
};
