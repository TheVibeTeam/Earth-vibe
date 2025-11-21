import admin from 'firebase-admin';
import UserModel from '../Models/User';
import logger from './logger';

let isInitialized = false;

export const initializeFirebaseAdmin = () => {
    if (!isInitialized) {
        try {
            if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    })
                });
                logger.info('Firebase Admin inicializado con variables de entorno');
            }
            else {
                const serviceAccount = require('../../firebase-adminsdk.json');
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                logger.info('Firebase Admin inicializado con archivo local');
            }

            isInitialized = true;
        } catch (error) {
            logger.warn('No se pudo inicializar Firebase Admin. Push notifications deshabilitadas.');
            logger.error('Verifica credenciales de Firebase (archivo o variables de entorno)');
        }
    }
};

interface PushNotificationData {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    data?: { [key: string]: string };
}

/**
 * Envía una notificación push a un usuario específico
 */
export const sendPushToUser = async (
    userId: string,
    notification: PushNotificationData
): Promise<boolean> => {
    try {
        if (!isInitialized) {
            logger.debug('Firebase Admin no inicializado, push notification omitida');
            return false;
        }

        const user = await UserModel.findById(userId);
        if (!user || !user.fcmToken) {
            logger.debug(`Usuario ${userId} no tiene token FCM registrado`);
            return false;
        }

        const message: admin.messaging.Message = {
            token: user.fcmToken,
            notification: {
                title: notification.title,
                body: notification.message,
            },
            data: {
                type: notification.type || 'general',
                priority: notification.priority || 'medium',
                ...notification.data,
            },
            android: {
                priority: notification.priority === 'high' ? 'high' : 'normal',
                notification: {
                    sound: 'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    channelId: 'earthvibe_notifications',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        const response = await admin.messaging().send(message);
        logger.info(`Push notification enviada a usuario ${userId}: ${response}`);
        return true;
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error enviando push notification:');

        if ((error as any).code === 'messaging/invalid-registration-token' ||
            (error as any).code === 'messaging/registration-token-not-registered') {
            await UserModel.findByIdAndUpdate(userId, { fcmToken: '' });
            logger.info(`Token FCM inválido eliminado para usuario ${userId}`);
        }

        return false;
    }
};

/**
 * Envía notificaciones push a múltiples usuarios
 */
export const sendPushToMultipleUsers = async (
    userIds: string[],
    notification: PushNotificationData
): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
        const sent = await sendPushToUser(userId, notification);
        if (sent) {
            success++;
        } else {
            failed++;
        }
    }

    logger.info(`Push notifications: ${success} exitosas, ${failed} fallidas`);
    return { success, failed };
};

/**
 * Envía notificaciones push a todos los usuarios
 */
export const sendPushToAll = async (
    notification: PushNotificationData,
    filter: 'all' | 'verified' = 'all'
): Promise<{ success: number; failed: number }> => {
    try {
        if (!isInitialized) {
            logger.debug('Firebase Admin no inicializado, push notifications omitidas');
            return { success: 0, failed: 0 };
        }

        const query = filter === 'verified' ? { verified: true } : {};
        const users = await UserModel.find(query).select('_id fcmToken');

        const tokensToSend = users
            .filter(u => u.fcmToken && u.fcmToken.trim() !== '')
            .map(u => u.fcmToken as string);

        if (tokensToSend.length === 0) {
            logger.debug('No hay tokens FCM registrados para enviar notificaciones');
            return { success: 0, failed: 0 };
        }

        logger.info(`Enviando push notifications a ${tokensToSend.length} dispositivos...`);

        const message: admin.messaging.MulticastMessage = {
            tokens: tokensToSend,
            notification: {
                title: notification.title,
                body: notification.message,
            },
            data: {
                type: notification.type || 'general',
                priority: notification.priority || 'medium',
                ...notification.data,
            },
            android: {
                priority: notification.priority === 'high' ? 'high' : 'normal',
                notification: {
                    sound: 'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    channelId: 'earthvibe_notifications',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        logger.info(`Push notifications enviadas: ${response.successCount} exitosas, ${response.failureCount} fallidas`);

        if (response.responses.length > 0) {
            const invalidTokenUsers: string[] = [];

            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = (resp.error as any)?.code;
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered') {
                        const user = users.find(u => u.fcmToken === tokensToSend[idx]);
                        if (user && user._id) {
                            invalidTokenUsers.push(user._id.toString());
                        }
                    }
                }
            });

            if (invalidTokenUsers.length > 0) {
                await UserModel.updateMany(
                    { _id: { $in: invalidTokenUsers } },
                    { fcmToken: '' }
                );
                logger.info(`Limpiados ${invalidTokenUsers.length} tokens FCM inválidos`);
            }
        }

        return {
            success: response.successCount,
            failed: response.failureCount,
        };
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error enviando push notifications masivas:');
        return { success: 0, failed: 0 };
    }
};
