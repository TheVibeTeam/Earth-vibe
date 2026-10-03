import logger from '../../../Utils/logger';
import ServiceModel from '../models/Service';

export default {
    name: 'Delete Service (Admin)',
    type: 'mutation',
    description: 'Delete service (Admin only)',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: true,
    mutation: `deleteService(serviceId: String!): ServiceResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('Acceso denegado. Solo administradores.');
            }

            const { serviceId } = args;
            logger.info({ serviceId }, 'Admin deleting service');

            let service = await ServiceModel.findOne({ serviceId });

            // Fallback: try finding by _id if not found by serviceId
            if (!service && serviceId.match(/^[0-9a-fA-F]{24}$/)) {
                service = await ServiceModel.findById(serviceId);
            }

            if (!service) throw new Error('Servicio no encontrado');

            await ServiceModel.findByIdAndDelete(service._id);

            return {
                success: true,
                message: 'Servicio eliminado exitosamente',
                service: null
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error deleting service');
            throw new Error(error.message || 'Error al eliminar servicio');
        }
    }
};
