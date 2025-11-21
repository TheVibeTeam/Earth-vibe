import type { Request, Response } from 'express';
import Product from '../../Models/Product';

export default {
    name: 'Create Product',
    path: '/earthvibe/admin/products/create',
    method: 'post',
    category: 'earthvibe',
    example: {
        barcode: '7501055363340',
        productName: 'Coca-Cola Zero',
        brand: 'Coca-Cola Company',
        category: 'Refresco',
        quantity: '600ml',
        points: 10,
        isActive: true
    },
    parameter: ['barcode', 'productName', 'brand', 'points'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        const { barcode, productName, brand, points } = req.body;

        if (!barcode) {
            return res.status(400).json({
                status: false,
                msg: 'barcode es requerido'
            });
        }

        if (!productName) {
            return res.status(400).json({
                status: false,
                msg: 'productName es requerido'
            });
        }

        if (!brand) {
            return res.status(400).json({
                status: false,
                msg: 'brand es requerido'
            });
        }

        if (points === undefined || typeof points !== 'number') {
            return res.status(400).json({
                status: false,
                msg: 'points es requerido y debe ser un número'
            });
        }

        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            const {
                barcode,
                productName,
                brand,
                category,
                quantity,
                points,
                isActive,
                imageUrl
            } = req.body;

            // Verificar si el producto ya existe
            const existingProduct = await Product.findOne({ barcode });
            if (existingProduct) {
                return res.status(409).json({
                    status: false,
                    msg: 'Ya existe un producto con este código de barras'
                });
            }

            // Crear nuevo producto
            const product = new Product({
                barcode,
                productName,
                brand,
                category: category || 'Bebida',
                quantity: quantity || '',
                points,
                isActive: isActive !== undefined ? isActive : true,
                imageUrl: imageUrl || ''
            });

            await product.save();

            res.status(201).json({
                status: true,
                msg: 'Producto creado exitosamente',
                data: product
            });
        } catch (error: any) {
            res.status(500).json({
                status: false,
                msg: 'Error al crear producto',
                error: error.message
            });
        }
    }
};
