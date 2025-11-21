import logger from '../../../Utils/logger';
import ServiceModel from '../models/Service';

export default {
    name: 'Create Service',
    type: 'mutation',
    description: 'Create a new service (Admin only)',
    file: __filename,
    category: 'services',
    requireAuth: true,
    mutation: `createService(input: CreateServiceInput!): ServiceResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user) throw new Error('No autorizado');
            if (context.user.role !== 'ADMIN') throw new Error('Requiere permisos de administrador');
            const { input } = args;
            logger.info({ serviceName: input.name }, 'Creating new service');
            const serviceId = `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const newService = await ServiceModel.create({
                serviceId,
                name: input.name,
                description: input.description,
                category: input.category,
                iconCode: input.iconCode,
                colorValue: input.colorValue,
                isActive: input.isActive ?? true,
                isFeatured: input.isFeatured ?? false,
                streamingPlans: input.streamingPlans,
                streamingDurations: input.streamingDurations,
                streamingPrices: input.streamingPrices,
                streamingDevices: input.streamingDevices,
                socialFollowersPackages: input.socialFollowersPackages,
                socialPrices: input.socialPrices,
                socialDeliveryTime: input.socialDeliveryTime,
                methodTypes: input.methodTypes,
                methodPrices: input.methodPrices,
                methodInstructions: input.methodInstructions
            });
            return {
                success: true,
                message: 'Servicio creado exitosamente',
                service: newService
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error creating service');
            throw new Error(error.message || 'Error al crear servicio');
        }
    }
};
