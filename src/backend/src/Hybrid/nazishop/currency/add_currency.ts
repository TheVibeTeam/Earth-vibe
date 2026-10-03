import logger from '../../../Utils/logger';
import CurrencyRateModel from '../models/CurrencyRate';

export default {
    name: 'Add Currency',
    type: 'mutation',
    description: 'Add a new currency to the system',
    file: __filename,
    category: 'currency',
    requireAuth: true,
    mutation: `addCurrency(code: String!, name: String!, rate: Float!): UpdateCurrencyRateResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('No autorizado. Se requiere rol de administrador');
            }

            const { code, name, rate } = args;

            if (!code || !name || !rate) {
                throw new Error('Todos los campos son requeridos');
            }

            if (rate <= 0) {
                throw new Error('La tasa debe ser mayor que 0');
            }

            const existing = await CurrencyRateModel.findOne({ code: code.toUpperCase() });
            if (existing) {
                throw new Error(`La divisa ${code} ya existe`);
            }

            logger.info(
                { code, name, rate, adminEmail: context.user.email },
                'Adding new currency'
            );

            const newCurrency = await CurrencyRateModel.create({
                code: code.toUpperCase(),
                name,
                rate,
                isActive: true,
                updatedBy: context.user.email,
            });

            return {
                success: true,
                message: `Divisa ${code} agregada exitosamente`,
                rate: {
                    id: (newCurrency._id as any).toString(),
                    code: newCurrency.code,
                    name: newCurrency.name,
                    rate: newCurrency.rate,
                    isActive: newCurrency.isActive,
                    lastUpdate: newCurrency.updatedAt?.toISOString() || null,
                    updatedBy: newCurrency.updatedBy,
                },
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error adding currency');
            throw new Error(error.message || 'Error al agregar divisa');
        }
    },
};
