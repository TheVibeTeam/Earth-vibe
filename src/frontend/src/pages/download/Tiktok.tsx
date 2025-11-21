import { useEffect, useState } from "react";
import socketIO from "socket.io-client";
import { encrypt, decrypt } from "../../utils/crypto";
import styles from "../css/Tiktok.module.css";

interface TiktokMedia {
    type: "video" | "image";
    duration?: number;
    nowatermark?: { size?: number; play?: string; hd?: { size: number; play: string } } | string;
    watermark?: { size?: number; play?: string } | string;
    images?: string[];
    image_count?: number;
}

interface TiktokVideo {
    id: string;
    title: string;
    cover: string;
    views_count: number;
    like_count: number;
    comment_count?: number;
    share_count?: number;
    favorite_count?: number;
    media: TiktokMedia;
    creation?: number;
    author: { id?: string; unique_id?: string; nickname: string; avatar: string };
    music?: any;
}

export default function TiktokPage() {
    const [socket, setSocket] = useState<ReturnType<typeof socketIO> | null>(null);
    const [results, setResults] = useState<TiktokVideo[]>([]);
    const [query, setQuery] = useState("");
    const [region, setRegion] = useState("ES");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [activeTab, setActiveTab] = useState<"search" | "trending" | "download">("search");

    const [progressMap, setProgressMap] = useState<Record<string, number>>({});
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        const socketInstance = socketIO("http://localhost:3001");

        socketInstance.on("connect", () => {
            console.log("connected");
        })

        const handlers: Record<string, (data: any) => void> = {
            "tiktok:search:success": (data) => setResults(data || []),
            "tiktok:trending:success": (data) => setResults(data || []),
            "tiktok:download:success": (data) => { setResults([data]) },
            "tiktok:error": (err) => setError(err?.message || "Error desconocido"),
        }

        Object.entries(handlers).forEach(([event, handler]) => {
            socketInstance.on(event, async (encrypted: { iv: string; data: string }) => {
                try {
                    const decrypted = decrypt(encrypted)
                    handler(decrypted)
                    setError("");
                } catch (e) {
                    setError("Error al procesar la respuesta")
                } finally {
                    setLoading(false)
                }
            });
        });

        setSocket(socketInstance);
        return () => { socketInstance.disconnect() }
    }, []);

    function extractPlayFromMaybeObject(val?: any): string | undefined {
        if (!val) return undefined
        if (typeof val === "string") return val
        if (typeof val === "object" && val.play) return val.play
        return undefined
    }

    function getMediaUrl(video: TiktokVideo, variant: "nowatermark" | "watermark" | "hd" = "nowatermark") {
        const media = video.media
        if (!media || media.type !== "video") return undefined

        const nowm = media.nowatermark
        const wm = media.watermark

        if (variant === "hd") {
            if (typeof nowm === "object" && nowm?.hd?.play) return nowm.hd.play
            const p = extractPlayFromMaybeObject(nowm) || extractPlayFromMaybeObject(wm)
            return p;
        }

        if (variant === "nowatermark") return extractPlayFromMaybeObject(nowm) || extractPlayFromMaybeObject(wm)
        return extractPlayFromMaybeObject(wm) || extractPlayFromMaybeObject(nowm)
    }

    async function downloadViaFetch(url: string, filename: string, id?: string) {
        if (!url) return
        setDownloadingId(id || null)
        setProgressMap((m) => ({ ...m, [id || filename]: 0 }))

        try {
            const res = await fetch(url)
            if (!res.ok) throw new Error("Error in response when downloading")

            const contentType = res.headers.get("content-type")

            const contentLengthHeader = res.headers.get("content-length")
            const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0

            if (!res.body || !total) {
                const blob = await res.blob()
                const blobType = blob.type || contentType || ""

                const isCompatibleFormat = blobType.includes("mp4") || blobType.includes("webm") || blobType.includes("quicktime")

                if (!isCompatibleFormat) {
                    filename = filename.replace(/\.[^/.]+$/, "") + ".mp4"
                }

                const blobUrl = URL.createObjectURL(blob)
                triggerDownload(blobUrl, filename)
                URL.revokeObjectURL(blobUrl)
                setProgressMap((m) => ({ ...m, [id || filename]: 100 }))
                return
            }

            const reader = res.body.getReader()
            const chunks: Uint8Array[] = []
            let received = 0

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                if (value) {
                    chunks.push(new Uint8Array(value))
                    received += value.length
                    const percent = total ? Math.round((received / total) * 100) : 0
                    setProgressMap((m) => ({ ...m, [id || filename]: percent }))
                }
            }

            const blob = new Blob(chunks as BlobPart[])
            const blobUrl = URL.createObjectURL(blob)
            triggerDownload(blobUrl, filename)
            URL.revokeObjectURL(blobUrl)
            setProgressMap((m) => ({ ...m, [id || filename]: 100 }))
        } catch (e) {
            window.open(url, "_blank", "noopener")
        } finally {
            setDownloadingId(null)
        }
    }

    function triggerDownload(href: string, filename: string) {
        const a = document.createElement("a")
        a.href = href
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
    }

    function sanitizeFilename(name: string, ext?: string) {
        const sanitized = name.replace(/[\/\\?%*:|"<>]/g, "-").trim().slice(0, 50)
        return ext ? `${sanitized}.${ext}` : sanitized
    }

    async function handleVideoDownload(video: TiktokVideo, variant: "nowatermark" | "watermark" | "hd" = "nowatermark") {
        const url = getMediaUrl(video, variant)
        if (!url) {
            setError("No download link found for this video.")
            return
        }

        setError("")
        const extension = "mp4"
        const baseName = `${video.author?.nickname || "tiktok"} - ${video.title || video.id}`
        const filename = sanitizeFilename(baseName, extension)

        await downloadViaFetch(url, filename, video.id)
    }

    const handleSearch = async () => {
        if (!socket || loading) return
        if (!query.trim()) return setError("Enter a search term")

        try {
            setLoading(true)
            setError("")
            setResults([])
            const encryptedData = await encrypt({ query: query.trim() })
            socket.emit("tiktok:search", encryptedData)
        } catch (err) {
            setError("Error processing search")
            setLoading(false)
        }
    };

    const handleDirectDownload = async () => {
        if (!socket || loading || !downloadUrl.trim()) return

        try {
            setLoading(true)
            setError("")
            setResults([])
            const encryptedData = await encrypt({ url: downloadUrl.trim() })
            socket.emit("tiktok:download", encryptedData)
            setDownloadUrl("")
        } catch (err) {
            setError("Error processing download")
            setLoading(false)
        }
    };

    const handleTrending = async () => {
        if (!socket || loading) return

        try {
            setLoading(true)
            setError("")
            setResults([])
            const encryptedData = await encrypt({ region })
            socket.emit("tiktok:trending", encryptedData)
        } catch (err) {
            setError("Error fetching trends")
            setLoading(false)
        }
    };

    return (
        <div className={styles.tiktokPage}>
            <nav className={styles.navbar}>
                <div className={styles.logo}><h1>TikTok Downloader</h1></div>
                <div className={styles.navLinks}>
                    {["search", "trending", "download"].map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.navButton} ${activeTab === tab ? styles.active : ""}`}
                            onClick={() => setActiveTab(tab as any)}
                        >
                            {tab === "search" ? "Buscar" : tab === "trending" ? "Tendencias" : "Descargar URL"}
                        </button>
                    ))}
                </div>
            </nav>

            <div className={styles.mainContent}>
                {activeTab === "search" && (
                    <div className={styles.searchSection}>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar en TikTok..."
                            className={styles.searchInput}
                        />
                        <button onClick={handleSearch} disabled={loading} className={styles.searchButton}>
                            {loading ? "Buscando..." : "Buscar"}
                        </button>
                    </div>
                )}

                {activeTab === "trending" && (
                    <div className={styles.trendingSection}>
                        <select value={region} onChange={(e) => setRegion(e.target.value)} className={styles.regionSelect}>
                            <option value="ES">España</option>
                            <option value="US">Estados Unidos</option>
                            <option value="MX">México</option>
                            <option value="AR">Argentina</option>
                            <option value="CO">Colombia</option>
                            <option value="CL">Chile</option>
                        </select>
                        <button onClick={handleTrending} disabled={loading} className={styles.trendingButton}>
                            {loading ? "Cargando..." : "Ver Tendencias"}
                        </button>
                    </div>
                )}

                {activeTab === "download" && (
                    <div className={styles.downloadSection}>
                        <input
                            type="text"
                            value={downloadUrl}
                            onChange={(e) => setDownloadUrl(e.target.value)}
                            placeholder="Pega la URL del video..."
                            className={styles.searchInput}
                        />
                        <button onClick={handleDirectDownload} disabled={loading || !downloadUrl.trim()} className={styles.downloadButton}>
                            {loading ? "Procesando..." : "Obtener Enlaces"}
                        </button>
                    </div>
                )}

                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.resultsGrid}>
                    {results.map((video) => (
                        <div key={video.id} className={styles.videoCard}>
                            <div className={styles.videoThumbnail}>
                                <img src={video.cover} alt={video.title} />
                                {video.media.type === "video" && video.media.duration && (
                                    <span className={styles.duration}>{formatDuration(video.media.duration)}</span>
                                )}
                                {video.media.type === "image" && video.media.image_count && (
                                    <span className={styles.imageCount}>{video.media.image_count} imágenes</span>
                                )}
                            </div>

                            <div className={styles.videoInfo}>
                                <div className={styles.authorInfo}>
                                    <img src={video.author.avatar} alt={video.author.nickname} className={styles.authorAvatar} />
                                    <span className={styles.authorName}>{video.author.nickname}</span>
                                </div>
                                <h3 className={styles.videoTitle}>{video.title}</h3>
                                <div className={styles.videoStats}>
                                    <span>{formatNumber(video.views_count)} vistas</span>
                                    <span>{formatNumber(video.like_count)} likes</span>
                                </div>

                                <div className={styles.downloadOptions}>
                                    {video.media.type === "video" ? (
                                        <>
                                            {getMediaUrl(video, "nowatermark") ? (
                                                <button
                                                    className={styles.downloadLink}
                                                    onClick={() => handleVideoDownload(video, "nowatermark")}
                                                    disabled={downloadingId === video.id}
                                                >
                                                    {downloadingId === video.id ? `Descargando... ${progressMap[video.id] ?? 0}%` : "Descargar (Sin marca)"}
                                                </button>
                                            ) : null}

                                            {getMediaUrl(video, "watermark") ? (
                                                <button
                                                    className={styles.downloadLink}
                                                    onClick={() => handleVideoDownload(video, "watermark")}
                                                    disabled={downloadingId === video.id}
                                                >
                                                    {downloadingId === video.id ? `Descargando... ${progressMap[video.id] ?? 0}%` : "Descargar (Con marca)"}
                                                </button>
                                            ) : null}

                                            {getMediaUrl(video, "hd") && getMediaUrl(video, "hd") !== getMediaUrl(video, "nowatermark") && (
                                                <button
                                                    className={styles.downloadLink}
                                                    onClick={() => handleVideoDownload(video, "hd")}
                                                    disabled={downloadingId === video.id}
                                                >
                                                    {downloadingId === video.id ? `Descargando... ${progressMap[video.id] ?? 0}%` : "Descargar (HD)"}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className={styles.imageGrid}>
                                            {video.media.images?.map((url, i) => (
                                                <button
                                                    key={i}
                                                    className={styles.downloadLink}
                                                    onClick={() => {
                                                        const ext = url.includes(".webp") ? "webp" : "jpg";
                                                        const imageName = `${video.title || video.id}-img-${i + 1}`;
                                                        downloadViaFetch(url, sanitizeFilename(imageName, ext));
                                                    }}
                                                >
                                                    Descargar imagen {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function formatNumber(num?: number): string {
    if (num === undefined || num === null) return "0";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
}

function formatDuration(seconds?: number): string {
    if (!seconds) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
}
