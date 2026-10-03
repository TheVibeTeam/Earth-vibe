import logger from '../../../Utils/logger';
import NaziShopUserModel from '../models/NaziShopUser';
import bcrypt from 'bcrypt';

export default {
    name: 'Update Password',
    type: 'mutation',
    description: 'Update authenticated user password',
    file: __filename,
    category: 'users',
    requireAuth: true,
    mutation: `updatePassword(input: UpdatePasswordInput!): UpdatePasswordPayload!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user) throw new Error('No autorizado');
            const { input } = args;
            const { oldPassword, newPassword } = input;
            
            logger.info({ userId: context.user.id }, 'Updating user password');
            
            const user = await NaziShopUserModel.findOne({ email: context.user.email });
            if (!user) throw new Error('Usuario no encontrado');
            
            if (!user.password) throw new Error('Usuario registrado con método externo, no tiene contraseña');

            const validPassword = await bcrypt.compare(oldPassword, user.password);
            if (!validPassword) throw new Error('La contraseña actual es incorrecta');

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            await NaziShopUserModel.updateOne(
                { _id: user._id },
                { 
                    $set: {
                        password: hashedPassword,
                        lastActiveTime: new Date()
                    }
                }
            );

            return {
                success: true,
                message: 'Contraseña actualizada exitosamente'
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error updating password');
            throw new Error(error.message || 'Error al actualizar contraseña');
        }
    }
};
