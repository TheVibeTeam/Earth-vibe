import logger from '../../../Utils/logger';
import ServiceModel from '../models/Service';

export default {
    name: 'Update Service (Admin)',
    type: 'mutation',
    description: 'Update service (Admin only)',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: true,
    mutation: `updateService(serviceId: String!, input: UpdateServiceInput!): ServiceResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('Acceso denegado. Solo administradores.');
            }

            const { serviceId, input } = args;
            logger.info({ serviceId }, 'Admin updating service');

            const service = await ServiceModel.findOne({ serviceId });
            if (!service) throw new Error('Servicio no encontrado');

            const updatedService = await ServiceModel.findOneAndUpdate(
                { serviceId },
                { $set: input },
                { new: true, runValidators: true }
            );

            return {
                success: true,
                message: 'Servicio actualizado exitosamente',
                service: updatedService
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error updating service');
            throw new Error(error.message || 'Error al actualizar servicio');
        }
    }
};
