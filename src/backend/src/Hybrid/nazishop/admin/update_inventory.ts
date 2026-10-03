import Inventory from '../models/Inventory';

export default {
    name: 'Update Inventory',
    type: 'mutation',
    description: 'Update an inventory item',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: true,
    mutation: 'updateInventory(id: ID!, input: UpdateInventoryInput!): UpdateInventoryPayload!',
    resolver: async (_: any, { id, input }: { id: string, input: any }, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('No autorizado');
            }

            const updatedItem = await Inventory.findByIdAndUpdate(
                id,
                { $set: input },
                { new: true }
            );

            if (!updatedItem) {
                return {
                    success: false,
                    message: 'Item de inventario no encontrado'
                };
            }

            return {
                success: true,
                message: 'Inventario actualizado correctamente',
                item: updatedItem
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message
            };
        }
    }
};
