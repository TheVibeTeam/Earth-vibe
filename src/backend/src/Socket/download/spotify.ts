import { Server, Socket } from "socket.io";
import SpotifyDownloader from "../../Utils/scrapper/spotify";
import { encrypt, decrypt } from "../../Utils/crypto";
import logger from "../../Utils/logger";

interface SpotifyRequest {
    url?: string;
    query?: string;
    type?: string;
    limit?: number;
}

interface EncryptedPayload {
    iv: string;
    data: string;
}

export default {
    name: "Spotify",
    description: "Download management for Spotify",
    events: ["spotify:download", "spotify:downloadV2", "spotify:search"],
    file: "spotify.ts",
    execution(socket: Socket) {
        socket.on("spotify:download", async (encrypted: EncryptedPayload) => {
            try {
                const decrypted = decrypt<SpotifyRequest>(encrypted);

                if (!decrypted.url) {
                    socket.emit("spotify:error", encrypt({
                        message: "URL requerida para descargar contenido",
                    }));
                    return;
                }

                logger.info({ url: decrypted.url }, `spotify:download`);

                try {
                    const result = await SpotifyDownloader.download(decrypted.url);

                    if (!result?.download) {
                        throw new Error("No se pudo obtener la URL de descarga");
                    }

                    socket.emit("spotify:download:url", encrypt({
                        url: result.download
                    }));

                    socket.emit("spotify:download:success", encrypt({
                        ...result,
                        title: result.name,
                        thumbnail: result.image
                    }));

                    logger.info({ url: decrypted.url }, `spotify:download:success`);
                } catch (error) {
                    logger.error({ error: String(error) }, "spotify:download:error");
                    socket.emit("spotify:error", encrypt({
                        message: "Error descargando el contenido: " + String(error),
                        details: error instanceof Error ? error.stack : undefined,
                    }));
                }
            } catch (error) {
                logger.error({ error: String(error) }, "spotify:download:error");
                socket.emit("spotify:error", encrypt({
                    message: "Error inesperado procesando la descarga",
                    details: String(error),
                }));
            }
        });

        socket.on("spotify:downloadV2", async (encrypted: EncryptedPayload) => {
            try {
                const decrypted = decrypt<SpotifyRequest>(encrypted);

                if (!decrypted.url) {
                    socket.emit("spotify:error", encrypt({
                        message: "URL requerida para descargar contenido",
                    }));
                    return;
                }

                logger.info({ url: decrypted.url }, `spotify:downloadV2`);

                try {
                    // Primero obtenemos la info de la canción
                    const info = await SpotifyDownloader.getInfo(decrypted.url);

                    // Luego intentamos la descarga con el método V2
                    const downloadUrl = await SpotifyDownloader.downloadV2(decrypted.url);

                    if (!downloadUrl) {
                        throw new Error("No se pudo obtener la URL de descarga");
                    }

                    socket.emit("spotify:downloadV2:url", encrypt({ url: downloadUrl }));
                    socket.emit("spotify:download:success", encrypt(info));
                    logger.info({ url: decrypted.url }, `spotify:downloadV2:success`);
                } catch (error) {
                    socket.emit("spotify:error", encrypt({
                        message: "Error descargando el contenido",
                        details: String(error),
                    }));
                }
            } catch (error) {
                logger.error("spotify:downloadV2:error");
                socket.emit("spotify:error", encrypt({
                    message: "Error inesperado procesando la descarga",
                    details: String(error),
                }));
            }
        });

        socket.on("spotify:search", async (encrypted: EncryptedPayload) => {
            try {
                const decrypted = decrypt<SpotifyRequest>(encrypted);
                if (!decrypted.query) {
                    socket.emit("spotify:error", encrypt({
                        message: "Consulta requerida para buscar",
                    }));
                    return;
                }

                logger.info({ query: decrypted.query }, `spotify:search`);

                try {
                    const results = await SpotifyDownloader.search(
                        decrypted.query,
                        decrypted.type,
                        decrypted.limit
                    );

                    socket.emit("spotify:search:success", encrypt(results));
                    logger.info({ query: decrypted.query }, `spotify:search:success`);
                } catch (error) {
                    socket.emit("spotify:error", encrypt({
                        message: "Error en la búsqueda",
                        details: String(error),
                    }));
                }
            } catch (error) {
                logger.error("spotify:search:error");
                socket.emit("spotify:error", encrypt({
                    message: "Error inesperado procesando la búsqueda",
                    details: String(error),
                }));
            }
        });
    },
};
