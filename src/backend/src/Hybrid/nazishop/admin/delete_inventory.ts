import Inventory from '../models/Inventory';

export default {
    name: 'Delete Inventory',
    type: 'mutation',
    description: 'Delete an inventory item',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: true,
    mutation: 'deleteInventory(id: ID!): DeleteInventoryPayload!',
    resolver: async (_: any, { id }: { id: string }, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('No autorizado');
            }

            const deletedItem = await Inventory.findByIdAndDelete(id);

            if (!deletedItem) {
                return {
                    success: false,
                    message: 'Item de inventario no encontrado'
                };
            }

            return {
                success: true,
                message: 'Item eliminado correctamente'
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message
            };
        }
    }
};
