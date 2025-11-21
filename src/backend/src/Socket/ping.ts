import { Server, Socket } from "socket.io";
import logger from "../Utils/logger";

export default {
    name: "ping",
    description: "Ping/Pong connection test",
    events: ["ping"],
    file: "ping.ts",
    execution(socket: Socket) {
        socket.on("ping", () => {
            logger.info({ socketId: socket.id }, "ping received");
            socket.emit("pong", {
                timestamp: Date.now(),
                message: "pong"
            });
        });

    }
};
