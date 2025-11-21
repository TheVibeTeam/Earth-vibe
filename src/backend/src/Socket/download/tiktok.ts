import { Server, Socket } from "socket.io";
import TiktokScraper from "../../Utils/scrapper/tiktok";
import { encrypt, decrypt } from "../../Utils/crypto";
import logger from "../../Utils/logger";

interface TiktokRequest {
    url?: string;
    query?: string;
    region?: string;
}

interface EncryptedPayload {
    iv: string;
    data: string;
}

export default {
    name: "Tiktok",
    description: "Download management for TikTok",
    events: ["tiktok:download", "tiktok:search", "tiktok:trending"],
    file: "tiktok.ts",
    execution(socket: Socket) {
        socket.on("tiktok:download", async (encrypted: EncryptedPayload) => {
            try {
                const decrypted = decrypt<TiktokRequest>(encrypted)

                if (!decrypted.url) {
                    socket.emit("tiktok:error", encrypt({
                        message: "URL required to download content",
                    }))
                    return
                }

                logger.info({ url: decrypted.url }, `tiktok:download`)

                const result = await TiktokScraper.download(decrypted.url)

                if (!result.status) {
                    socket.emit("tiktok:error", encrypt({
                        message: "Error downloading content",
                        details: result.error,
                    }))
                    return
                }

                socket.emit("tiktok:download:success", encrypt(result.data))
                logger.info({ url: decrypted.url }, `tiktok:download:success`)
            } catch (error) {
                logger.error("tiktok:download:error")
                socket.emit("tiktok:error", encrypt({
                    message: "Unexpected error processing download",
                    details: String(error),
                }))
            }
        })

        socket.on("tiktok:search", async (encrypted: EncryptedPayload) => {
            try {
                const decrypted = decrypt<TiktokRequest>(encrypted);
                if (!decrypted.query) {
                    socket.emit("tiktok:error", encrypt({
                        message: "Query required to search",
                    }))
                    return
                }

                logger.info({ query: decrypted.query }, `tiktok:search`)

                const result = await TiktokScraper.search(
                    decrypted.query
                )

                if (!result.status) {
                    socket.emit("tiktok:error", encrypt({
                        message: "Error searching",
                        details: result.error,
                    }))
                    return
                }

                socket.emit("tiktok:search:success", encrypt(result.data))
                logger.info({ query: decrypted.query }, `tiktok:search:success`)
            } catch (error) {
                logger.error("tiktok:search:error")
                socket.emit("tiktok:error", encrypt({
                    message: "Unexpected error processing search",
                    details: String(error),
                }))
            }
        })

        socket.on("tiktok:trending", async (encrypted: EncryptedPayload) => {
            try {
                const decrypted = decrypt<TiktokRequest>(encrypted)

                if (!decrypted.region) {
                    socket.emit("tiktok:error", encrypt({
                        message: "Region required to view trends",
                    }))
                    return
                }

                logger.info({ region: decrypted.region }, `tiktok:trending`)

                const result = await TiktokScraper.trending(decrypted.region)

                if (!result.status) {
                    socket.emit("tiktok:error", encrypt({
                        message: "Error obtaining trends",
                        details: result.error,
                    }))
                    return
                }

                socket.emit("tiktok:trending:success", encrypt(result.data))
                logger.info({ region: decrypted.region, trends: result.data }, `tiktok:trending:success`)
            } catch (error) {
                logger.error("tiktok:trending:error")
                socket.emit("tiktok:error", encrypt({
                    message: "Unexpected error processing trends",
                    details: String(error),
                }))
            }
        })
    },
};
