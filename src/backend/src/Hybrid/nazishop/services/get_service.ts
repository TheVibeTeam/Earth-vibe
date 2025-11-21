import logger from '../../../Utils/logger';
import ServiceModel from '../models/Service';

export default {
    name: 'Get Service By ID',
    type: 'query',
    description: 'Get a single service by ID',
    file: __filename,
    category: 'services',
    query: `service(serviceId: String!): Service`,
    resolver: async (_: any, args: any) => {
        try {
            const { serviceId } = args;
            logger.info({ serviceId }, 'Fetching service by ID');
            const service = await ServiceModel.findOne({ serviceId, isActive: true });
            if (!service) throw new Error('Servicio no encontrado');
            return service;
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching service');
            throw new Error(error.message || 'Error al obtener servicio');
        }
    }
};
