import { Server, Socket } from "socket.io";
import logger from "../Utils/logger";

export default {
    name: "posts",
    description: "Real-time posts updates handler",
    events: ["subscribe_posts", "unsubscribe_posts"],
    file: "posts.ts",
    execution(socket: Socket) {
        // Usuario se suscribe a actualizaciones de posts
        socket.on("subscribe_posts", () => {
            socket.join("posts_feed");
            socket.emit("subscribed_posts", { 
                message: "Suscrito a actualizaciones de posts" 
            });
            logger.debug({ socketId: socket.id }, "Cliente suscrito a posts");
        });

        // Usuario se desuscribe de actualizaciones de posts
        socket.on("unsubscribe_posts", () => {
            socket.leave("posts_feed");
            logger.debug({ socketId: socket.id }, "Cliente desuscrito de posts");
        });
    },

    // Función helper para emitir cuando se crea un nuevo post
    emitNewPost(io: Server, postData: any) {
        io.to("posts_feed").emit("new_post", {
            action: "create",
            post: postData,
            timestamp: Date.now()
        });
        logger.info({ postId: postData._id }, "Nuevo post emitido a suscriptores");
    },

    // Función helper para emitir cuando se actualiza un post
    emitUpdatePost(io: Server, postData: any) {
        io.to("posts_feed").emit("update_post", {
            action: "update",
            post: postData,
            timestamp: Date.now()
        });
        logger.info({ postId: postData._id }, "Post actualizado emitido a suscriptores");
    },

    // Función helper para emitir cuando se elimina un post
    emitDeletePost(io: Server, postId: string) {
        io.to("posts_feed").emit("delete_post", {
            action: "delete",
            postId: postId,
            timestamp: Date.now()
        });
        logger.info({ postId }, "Post eliminado emitido a suscriptores");
    },

    // Función helper para emitir cuando se actualiza like en un post
    emitLikeUpdate(io: Server, postId: string, likesCount: number, userId: string, isLiked: boolean) {
        io.to("posts_feed").emit("post_like_update", {
            action: isLiked ? "like" : "unlike",
            postId: postId,
            likesCount: likesCount,
            userId: userId,
            timestamp: Date.now()
        });
        logger.debug({ postId, likesCount }, "Like actualizado emitido");
    },

    // Función helper para emitir cuando se actualiza favorito en un post
    emitFavoriteUpdate(io: Server, postId: string, favoritesCount: number, userId: string, isFavorited: boolean) {
        io.to("posts_feed").emit("post_favorite_update", {
            action: isFavorited ? "favorite" : "unfavorite",
            postId: postId,
            favoritesCount: favoritesCount,
            userId: userId,
            timestamp: Date.now()
        });
        logger.debug({ postId, favoritesCount }, "Favorito actualizado emitido");
    }
};
