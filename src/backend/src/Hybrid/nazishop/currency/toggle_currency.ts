import logger from '../../../Utils/logger';
import CurrencyRateModel from '../models/CurrencyRate';

export default {
    name: 'Toggle Currency Active',
    type: 'mutation',
    description: 'Activate or deactivate a currency',
    file: __filename,
    category: 'currency',
    requireAuth: true,
    mutation: `toggleCurrencyActive(code: String!, isActive: Boolean!): UpdateCurrencyRateResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('No autorizado. Se requiere rol de administrador');
            }

            const { code, isActive } = args;

            const updatedCurrency = await CurrencyRateModel.findOneAndUpdate(
                { code: code.toUpperCase() },
                {
                    isActive,
                    updatedBy: context.user.email,
                },
                {
                    new: true,
                }
            );

            if (!updatedCurrency) {
                throw new Error(`Divisa ${code} no encontrada`);
            }

            logger.info(
                { code, isActive, adminEmail: context.user.email },
                'Toggled currency active status'
            );

            return {
                success: true,
                message: `Divisa ${code} ${isActive ? 'activada' : 'desactivada'}`,
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
            logger.error({ error: error.message }, 'Error toggling currency');
            throw new Error(error.message || 'Error al cambiar estado de divisa');
        }
    },
};
