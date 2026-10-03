import logger from '../../../Utils/logger';
import CurrencyRateModel from '../models/CurrencyRate';

export default {
    name: 'Update Currency Rate',
    type: 'mutation',
    description: 'Update an existing currency rate',
    file: __filename,
    category: 'currency',
    requireAuth: true,
    mutation: `updateCurrencyRate(code: String!, rate: Float!): UpdateCurrencyRateResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('No autorizado. Se requiere rol de administrador');
            }

            const { code, rate } = args;

            if (rate <= 0) {
                throw new Error('La tasa debe ser mayor que 0');
            }

            logger.info(
                { code, rate, adminEmail: context.user.email },
                'Updating currency rate'
            );

            const updatedCurrency = await CurrencyRateModel.findOneAndUpdate(
                { code: code.toUpperCase() },
                {
                    rate,
                    updatedBy: context.user.email,
                },
                {
                    new: true,
                }
            );

            if (!updatedCurrency) {
                throw new Error(`Divisa ${code} no encontrada`);
            }

            return {
                success: true,
                message: `Tasa de ${code} actualizada a ${rate}`,
                rate: {
                    id: (updatedCurrency._id as any).toString(),
                    code: updatedCurrency.code,
                    name: updatedCurrency.name,
                    rate: updatedCurrency.rate,
                    isActive: updatedCurrency.isActive,
                    lastUpdate: updatedCurrency.updatedAt?.toISOString() || null,
                    updatedBy: updatedCurrency.updatedBy,
                },
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error updating currency rate');
            throw new Error(error.message || 'Error al actualizar tasa de cambio');
        }
    },
};
