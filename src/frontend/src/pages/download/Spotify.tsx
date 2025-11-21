import { useEffect, useState } from 'react';
import socketIO from 'socket.io-client';
import styles from '../css/Spotify.module.css';
import { encrypt, decrypt } from '../../utils/crypto';

interface SpotifyTrack {
    id: string;
    title: string;
    duration: number;
    popularity: string;
    thumbnail: string;
    date: string;
    artist: Array<{
        name: string;
        type: string;
        id: string;
    }>;
    url: string;
}

export default function SpotifyPage() {
    const [socket, setSocket] = useState<ReturnType<typeof socketIO> | null>(null);
    const [results, setResults] = useState<SpotifyTrack[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [activeTab, setActiveTab] = useState<"search" | "download">("search");
    const [progressMap, setProgressMap] = useState<Record<string, number>>({});
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        const socketInstance = socketIO("http://localhost:3001");

        socketInstance.on("connect", () => {
            console.log("connected");
        });

        const handlers: Record<string, (data: any) => void> = {
            "spotify:search:success": (data) => setResults(data || []),
            "spotify:download:success": (data) => { setResults([data]) },
            "spotify:error": (err) => setError(err?.message || "Error desconocido"),
        };

        Object.entries(handlers).forEach(([event, handler]) => {
            socketInstance.on(event, async (encrypted: { iv: string; data: string }) => {
                try {
                    const decrypted = decrypt(encrypted);
                    handler(decrypted);
                    setError("");
                } catch (e) {
                    setError("Error al procesar la respuesta");
                } finally {
                    setLoading(false);
                }
            });
        });

        setSocket(socketInstance);
        return () => { socketInstance.disconnect(); };
    }, []);

    async function downloadViaFetch(url: string, filename: string, id?: string) {
        if (!url) return;
        setDownloadingId(id || null);
        setProgressMap((m) => ({ ...m, [id || filename]: 0 }));

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Error in response when downloading");

            const contentType = res.headers.get("content-type");
            const contentLengthHeader = res.headers.get("content-length");
            const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

            if (!res.body || !total) {
                const blob = await res.blob();
                const blobType = blob.type || contentType || "";

                const isCompatibleFormat = blobType.includes("mp3") || blobType.includes("audio");

                if (!isCompatibleFormat) {
                    filename = filename.replace(/\.[^/.]+$/, "") + ".mp3";
                }

                const blobUrl = URL.createObjectURL(blob);
                triggerDownload(blobUrl, filename);
                URL.revokeObjectURL(blobUrl);
                setProgressMap((m) => ({ ...m, [id || filename]: 100 }));
                return;
            }

            const reader = res.body.getReader();
            const chunks: Uint8Array[] = [];
            let received = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(new Uint8Array(value));
                    received += value.length;
                    const percent = total ? Math.round((received / total) * 100) : 0;
                    setProgressMap((m) => ({ ...m, [id || filename]: percent }));
                }
            }

            const blob = new Blob(chunks as BlobPart[]);
            const blobUrl = URL.createObjectURL(blob);
            triggerDownload(blobUrl, filename);
            URL.revokeObjectURL(blobUrl);
            setProgressMap((m) => ({ ...m, [id || filename]: 100 }));
        } catch (e) {
            window.open(url, "_blank", "noopener");
        } finally {
            setDownloadingId(null);
        }
    }

    function triggerDownload(href: string, filename: string) {
        const a = document.createElement("a");
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    function sanitizeFilename(name: string, ext?: string) {
        const sanitized = name.replace(/[\/\\?%*:|"<>]/g, "-").trim().slice(0, 50);
        return ext ? `${sanitized}.${ext}` : sanitized;
    }

    async function handleTrackDownload(track: SpotifyTrack, useV2: boolean = true) {
        if (!socket) return;

        try {
            setLoading(true);
            setError("");
            const encryptedData = await encrypt({ url: track.url });
            socket.emit(useV2 ? "spotify:downloadV2" : "spotify:download", encryptedData);
            
            const downloadMethod = useV2 ? "downloadV2" : "download";
            socket.on(`spotify:${downloadMethod}:url`, async (encrypted: { iv: string; data: string }) => {
                try {
                    const decrypted = decrypt(encrypted) as { url: string };
                    if (!decrypted?.url) {
                        throw new Error("No se pudo obtener la URL de descarga");
                    }

                    const filename = sanitizeFilename(
                        `${track.artist.map(a => a.name).join(", ")} - ${track.title}`,
                        "mp3"
                    );

                    await downloadViaFetch(decrypted.url, filename, track.id);
                } catch (e) {
                    setError("Error al procesar la descarga");
                } finally {
                    setLoading(false);
                }
            });
        } catch (err) {
            setError("Error al iniciar la descarga");
            setLoading(false);
        }
    }

    const handleSearch = async () => {
        if (!socket || loading) return;
        if (!query.trim()) return setError("Ingresa un término de búsqueda");

        try {
            setLoading(true);
            setError("");
            setResults([]);
            const encryptedData = await encrypt({ query: query.trim() });
            socket.emit("spotify:search", encryptedData);
        } catch (err) {
            setError("Error al procesar la búsqueda");
            setLoading(false);
        }
    };

    const handleDirectDownload = async () => {
        if (!socket || loading || !downloadUrl.trim()) return;

        try {
            setLoading(true);
            setError("");
            setResults([]);
            const encryptedData = await encrypt({ url: downloadUrl.trim() });
            socket.emit("spotify:download", encryptedData);
            setDownloadUrl("");
        } catch (err) {
            setError("Error al procesar la descarga");
            setLoading(false);
        }
    };

    return (
        <div className={styles.tiktokPage}>
            <nav className={styles.navbar}>
                <div className={styles.logo}><h1>Spotify Downloader</h1></div>
                <div className={styles.navLinks}>
                    {["search", "download"].map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.navButton} ${activeTab === tab ? styles.active : ""}`}
                            onClick={() => setActiveTab(tab as any)}
                        >
                            {tab === "search" ? "Buscar" : "Descargar URL"}
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
                            placeholder="Buscar en Spotify..."
                            className={styles.searchInput}
                        />
                        <button onClick={handleSearch} disabled={loading} className={styles.searchButton}>
                            {loading ? "Buscando..." : "Buscar"}
                        </button>
                    </div>
                )}

                {activeTab === "download" && (
                    <div className={styles.downloadSection}>
                        <input
                            type="text"
                            value={downloadUrl}
                            onChange={(e) => setDownloadUrl(e.target.value)}
                            placeholder="Pega la URL de la canción..."
                            className={styles.searchInput}
                        />
                        <button onClick={handleDirectDownload} disabled={loading || !downloadUrl.trim()} className={styles.downloadButton}>
                            {loading ? "Procesando..." : "Obtener Enlaces"}
                        </button>
                    </div>
                )}

                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.resultsGrid}>
                    {results.map((track) => (
                        <div key={track.id} className={styles.trackCard}>
                            <div className={styles.albumArt}>
                                <img src={track.thumbnail} alt={track.title} />
                                <span className={styles.duration}>{formatDuration(track.duration)}</span>
                            </div>

                            <div className={styles.trackInfo}>
                                <h3 className={styles.trackTitle}>{track.title}</h3>
                                <div className={styles.artistName}>
                                    {track.artist.map(a => a.name).join(", ")}
                                </div>
                                
                                <div className={styles.trackStats}>
                                    <span>Popularidad: {track.popularity}</span>
                                    <span>{formatDate(track.date)}</span>
                                </div>

                                <div className={styles.downloadOptions}>
                                    <button
                                        onClick={() => handleTrackDownload(track, true)}
                                        disabled={loading || downloadingId === track.id}
                                        className={`${styles.downloadButton} ${downloadingId === track.id ? styles.downloading : ''}`}
                                    >
                                        {downloadingId === track.id 
                                            ? `Descargando ${progressMap[track.id] || 0}%`
                                            : "Descargar MP3"
                                        }
                                    </button>
                                    {downloadingId === track.id && (
                                        <div className={styles.progressBar}>
                                            <div 
                                                className={styles.progressFill} 
                                                style={{ width: `${progressMap[track.id] || 0}%` }}
                                            />
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

function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
