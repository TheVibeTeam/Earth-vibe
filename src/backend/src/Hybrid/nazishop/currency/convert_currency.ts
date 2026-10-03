import logger from '../../../Utils/logger';
import CurrencyRateModel from '../models/CurrencyRate';

export default {
    name: 'Convert Currency',
    type: 'query',
    description: 'Convert amount between currencies',
    file: __filename,
    category: 'currency',
    query: `convertCurrency(amount: Float!, from: String!, to: String!): ConvertCurrencyResponse!`,
    resolver: async (_: any, args: any) => {
        try {
            const { amount, from, to } = args;

            if (amount <= 0) {
                throw new Error('El monto debe ser mayor que 0');
            }

            const fromUpper = from.toUpperCase();
            const toUpper = to.toUpperCase();

            // Si son iguales, no convertir
            if (fromUpper === toUpper) {
                return {
                    amount,
                    convertedAmount: amount,
                    from: fromUpper,
                    to: toUpper,
                    rate: 1,
                };
            }

            let convertedAmount: number;
            let exchangeRate: number;

            // Si from es USD
            if (fromUpper === 'USD') {
                const toCurrency = await CurrencyRateModel.findOne({ code: toUpper, isActive: true });
                if (!toCurrency) throw new Error(`Divisa ${toUpper} no encontrada`);

                exchangeRate = toCurrency.rate;
                convertedAmount = amount * exchangeRate;
            }
            // Si to es USD
            else if (toUpper === 'USD') {
                const fromCurrency = await CurrencyRateModel.findOne({ code: fromUpper, isActive: true });
                if (!fromCurrency) throw new Error(`Divisa ${fromUpper} no encontrada`);

                exchangeRate = 1 / fromCurrency.rate;
                convertedAmount = amount / fromCurrency.rate;
            }
            // Conversión entre dos monedas (pasando por USD)
            else {
                const fromCurrency = await CurrencyRateModel.findOne({ code: fromUpper, isActive: true });
                const toCurrency = await CurrencyRateModel.findOne({ code: toUpper, isActive: true });

                if (!fromCurrency) throw new Error(`Divisa ${fromUpper} no encontrada`);
                if (!toCurrency) throw new Error(`Divisa ${toUpper} no encontrada`);

                // Convertir a USD primero, luego a la moneda destino
                const amountInUSD = amount / fromCurrency.rate;
                convertedAmount = amountInUSD * toCurrency.rate;
                exchangeRate = toCurrency.rate / fromCurrency.rate;
            }

            logger.info(
                { amount, from: fromUpper, to: toUpper, convertedAmount, exchangeRate },
                'Currency conversion'
            );

            return {
                amount,
                convertedAmount: Math.round(convertedAmount * 100) / 100, // 2 decimales
                from: fromUpper,
                to: toUpper,
                rate: Math.round(exchangeRate * 10000) / 10000, // 4 decimales
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error converting currency');
            throw new Error(error.message || 'Error en conversión de divisa');
        }
    },
};
