import { Server, Socket } from "socket.io";
import logger from "../Utils/logger";
import jwt from 'jsonwebtoken';

interface SocketUser {
    userId: string;
    socketId: string;
    email: string;
}

// Mapa en memoria de usuarios conectados (userId -> socketId)
const connectedUsers = new Map<string, string>();

export default {
    name: "notifications",
    description: "Real-time notifications handler",
    events: ["authenticate", "disconnect"],
    file: "notifications.ts",
    execution(socket: Socket) {
        let authenticatedUserId: string | null = null;

        // Evento de autenticación - el cliente envía su JWT
        socket.on("authenticate", (data: { token: string }) => {
            try {
                const { token } = data;
                
                if (!token) {
                    socket.emit("auth_error", { message: "Token no proporcionado" });
                    return;
                }

                // Verificar JWT
                const secret = process.env.JWT_SECRET || 'default_secret';
                const decoded = jwt.verify(token, secret) as any;
                
                authenticatedUserId = decoded.userId || decoded.id;
                
                if (!authenticatedUserId) {
                    socket.emit("auth_error", { message: "Token inválido" });
                    return;
                }

                // Guardar la conexión
                connectedUsers.set(authenticatedUserId, socket.id);
                
                socket.emit("authenticated", { 
                    userId: authenticatedUserId,
                    message: "Autenticado correctamente" 
                });

                logger.info({ 
                    userId: authenticatedUserId, 
                    socketId: socket.id 
                }, "Usuario autenticado en Socket.IO");

            } catch (error) {
                logger.error({ error }, "Error en autenticación Socket.IO");
                socket.emit("auth_error", { message: "Error de autenticación" });
            }
        });

        // Cuando el socket se desconecta
        socket.on("disconnect", () => {
            if (authenticatedUserId) {
                connectedUsers.delete(authenticatedUserId);
                logger.info({ 
                    userId: authenticatedUserId, 
                    socketId: socket.id 
                }, "Usuario desconectado de Socket.IO");
            }
        });
    },

    // Función helper para emitir notificación a un usuario específico
    emitToUser(io: Server, userId: string, event: string, data: any) {
        const socketId = connectedUsers.get(userId);
        if (socketId) {
            io.to(socketId).emit(event, data);
            logger.debug({ userId, event, socketId }, "Evento emitido a usuario");
            return true;
        }
        return false;
    },

    // Función helper para emitir a múltiples usuarios
    emitToUsers(io: Server, userIds: string[], event: string, data: any) {
        let successCount = 0;
        userIds.forEach(userId => {
            if (this.emitToUser(io, userId, event, data)) {
                successCount++;
            }
        });
        return successCount;
    },

    // Función helper para verificar si un usuario está conectado
    isUserConnected(userId: string): boolean {
        return connectedUsers.has(userId);
    },

    // Obtener todos los usuarios conectados
    getConnectedUsers(): string[] {
        return Array.from(connectedUsers.keys());
    }
};
