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

            let service = await ServiceModel.findOne({ serviceId });
            
            // Fallback: try finding by _id if not found by serviceId
            if (!service && serviceId.match(/^[0-9a-fA-F]{24}$/)) {
                service = await ServiceModel.findById(serviceId);
            }

            if (!service) throw new Error('Servicio no encontrado');

            // Use the found service's _id for the update to be safe
            const updatedService = await ServiceModel.findByIdAndUpdate(
                service._id,
                { $set: input },
                { new: true, runValidators: true }
            );

            if (!updatedService) throw new Error('No se pudo actualizar el servicio');

            const serviceObject = updatedService.toObject();

            return {
                success: true,
                message: 'Servicio actualizado exitosamente',
                service: {
                    ...serviceObject,
                    id: (serviceObject._id as any).toString(),
                    createdAt: serviceObject.createdAt?.toISOString(),
                    updatedAt: serviceObject.updatedAt?.toISOString(),
                }
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error updating service');
            throw new Error(error.message || 'Error al actualizar servicio');
        }
    }
};
