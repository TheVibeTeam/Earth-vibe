import logger from '../../../Utils/logger';
import CurrencyRateModel from '../models/CurrencyRate';

export default {
    name: 'Get All Currency Rates',
    type: 'query',
    description: 'Get all active currency rates',
    file: __filename,
    category: 'currency',
    query: `currencyRates: CurrencyRatesResponse!`,
    resolver: async () => {
        try {
            const currencies = await CurrencyRateModel.find({ isActive: true }).sort({ code: 1 });

            const rates = currencies.map((curr) => ({
                id: (curr._id as any).toString(),
                code: curr.code,
                name: curr.name,
                rate: curr.rate,
                isActive: curr.isActive,
                lastUpdate: curr.updatedAt?.toISOString() || null,
                updatedBy: curr.updatedBy || null,
            }));

            return { rates };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching currency rates');
            throw new Error('Error al obtener tasas de cambio');
        }
    },
};
