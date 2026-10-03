import logger from '../../../Utils/logger';
import ServiceModel from '../models/Service';
import InventoryModel from '../models/Inventory';
import CurrencyRateModel from '../../../Models/CurrencyRate';

// Helper inline para convertir de USD a otra moneda
async function convertFromUSD(amountUSD: number, targetCurrency: string): Promise<number> {
    if (targetCurrency === 'USD') return amountUSD;

    const DEFAULT_RATES = { MXN: 17.5, COP: 4200 };
    const dbRate = await CurrencyRateModel.findOne({ currency: targetCurrency });
    const rate = dbRate?.rate || DEFAULT_RATES[targetCurrency as keyof typeof DEFAULT_RATES] || 1;

    return amountUSD * rate;
}

export default {
    name: 'Get Service By ID',
    type: 'query',
    description: 'Get a single service by ID with optional currency conversion',
    file: __filename,
    category: 'services',
    query: `service(serviceId: String!, currency: String): Service`,
    resolver: async (_: any, args: any) => {
        try {
            const { serviceId, currency } = args;

            let service = await ServiceModel.findOne({ serviceId, isActive: true });
            if (!service && serviceId.match(/^[0-9a-fA-F]{24}$/)) {
                service = await ServiceModel.findOne({ _id: serviceId, isActive: true });
            }
            if (!service) throw new Error('Servicio no encontrado');

            const serviceObject = service.toObject();
            const inventoryItems = await InventoryModel.find({
                serviceId: serviceObject.serviceId,
                isAvailable: true,
            });

            let streamingPrices: number[] = serviceObject.streamingPrices || [];
            let streamingPlans: string[] = serviceObject.streamingPlans || [];
            let streamingDurations: string[] = serviceObject.streamingDurations || [];

            if (inventoryItems.length > 0) {
                const inventoryPrices = inventoryItems.map((item: any) => item.price).filter((p: any) => p != null);
                const inventoryPlans = inventoryItems.map((item: any) => item.plan).filter((p: any) => p != null);
                const inventoryDurations = inventoryItems.map((item: any) => item.duration).filter((d: any) => d != null);

                if (inventoryPrices.length > 0) streamingPrices = [...new Set([...streamingPrices, ...inventoryPrices])];
                if (inventoryPlans.length > 0) {
                    streamingPlans = [...new Set([...streamingPlans, ...inventoryPlans])];
                } else if (streamingPlans.length === 0) {
                    streamingPlans = Array(inventoryItems.length).fill('Cuenta');
                }
                if (inventoryDurations.length > 0) {
                    streamingDurations = [...new Set([...streamingDurations, ...inventoryDurations])];
                } else if (streamingDurations.length === 0 && inventoryItems.length > 0) {
                    streamingDurations = Array(inventoryItems.length).fill('1 Mes');
                }
            }

            // Convertir precios si se especificó currency
            if (currency && currency !== 'USD') {
                streamingPrices = await Promise.all(
                    streamingPrices.map((price) => convertFromUSD(price, currency))
                );
            }

            const result = {
                ...serviceObject,
                id: (serviceObject._id as any).toString(),
                createdAt: serviceObject.createdAt?.toISOString(),
                updatedAt: serviceObject.updatedAt?.toISOString(),
                streamingPrices,
                streamingPlans,
                streamingDurations,
            };

            return result;
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching service');
            throw new Error(error.message || 'Error al obtener servicio');
        }
    },
};
