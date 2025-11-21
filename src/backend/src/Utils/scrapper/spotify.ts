import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

interface SpotifyCredentials {
    access_token: string;
}

interface SpotifyTrack {
    id: string;
    type: string;
    name: string;
    image: string;
    artists: Array<{
        name: string;
        type: string;
        id: string;
    }>;
    duration_ms: number;
    download_url?: string;
    gid: string;
}

interface SpotifyDownloadResult {
    id: string;
    type: string;
    name: string;
    image: string;
    artists: Array<{
        name: string;
        type: string;
        id: string;
    }>;
    duration: number;
    download: string;
}

interface SpotifySearchResult {
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

export default new class Spotify {
    private baseUrl: string;
    private client: AxiosInstance;

    constructor() {
        this.baseUrl = 'https://api.fabdl.com';
        const jar = new CookieJar();
        this.client = wrapper(axios.create({ 
            jar,
            withCredentials: true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
                'Accept-Language': 'es-419,es;q=0.9',
                'Accept': '*/*'
            }
        }));
    }

    private async spotifyCreds(): Promise<SpotifyCredentials> {
        try {
            const { data } = await this.client.post<SpotifyCredentials>(
                'https://accounts.spotify.com/api/token',
                'grant_type=client_credentials',
                {
                    headers: {
                        Authorization: `Basic ${Buffer.from(
                            `4c4fc8c3496243cbba99b39826e2841f:d598f89aba0946e2b85fb8aefa9ae4c8`
                        ).toString('base64')}`
                    }
                }
            );
            return data;
        } catch (error) {
            console.error('Error obteniendo credenciales:', error);
            throw new Error('Error al obtener credenciales de Spotify');
        }
    }

    async getInfo(url: string) {
        try {
            const creds = await this.spotifyCreds();
            if (!creds.access_token) {
                throw new Error('No se pudo obtener el token de acceso');
            }

            const trackId = url.split('track/')[1];
            const { data } = await this.client.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { Authorization: `Bearer ${creds.access_token}` }
            });

            return {
                id: data.id,
                title: data.name,
                duration: data.duration_ms,
                popularity: data.popularity + '%',
                thumbnail: data.album.images.find((image: { height: number; url: string }) => image.height === 640)?.url,
                date: data.album.release_date,
                artist: data.artists.map((artist: { name: string; type: string; id: string }) => ({ name: artist.name, type: artist.type, id: artist.id })),
                url: data.external_urls.spotify
            };
        } catch (error) {
            console.error('Error obteniendo información:', error);
            throw new Error('Error al obtener información de la canción');
        }
    }

    async search(query: string, type: string = 'track', limit: number = 20): Promise<SpotifySearchResult[]> {
        try {
            const creds = await this.spotifyCreds();
            if (!creds.access_token) {
                throw new Error('No se pudo obtener el token de acceso');
            }

            const { data: { tracks: { items } } } = await this.client.get(
                `https://api.spotify.com/v1/search?query=${encodeURIComponent(query)}&type=${type}&offset=0&limit=${limit}`,
                { headers: { Authorization: `Bearer ${creds.access_token}` } }
            );

            return items.map((data: {
                id: string;
                name: string;
                duration_ms: number;
                popularity: number;
                album: {
                    images: Array<{ height: number; url: string }>;
                    release_date: string;
                };
                artists: Array<{ name: string; type: string; id: string }>;
                external_urls: { spotify: string };
            }) => ({
                id: data.id,
                title: data.name,
                duration: data.duration_ms,
                popularity: data.popularity + '%',
                thumbnail: data.album.images.find(({ height }) => height === 640)?.url,
                date: data.album.release_date,
                artist: data.artists.map(({ name, type, id }) => ({ name, type, id })),
                url: data.external_urls.spotify
            }));
        } catch (error) {
            console.error('Error en búsqueda:', error);
            throw new Error('Error al buscar canciones');
        }
    }

    async downloadV2(url: string): Promise<string> {
        try {
            // Primero obtenemos las cookies y el token CSRF
            const { headers } = await this.client.get('https://spotmate.online/en');
            const csrfToken = headers['set-cookie']?.find(c => c.includes('XSRF-TOKEN='))
                ?.split(';')[0]?.split('=')[1];

            if (!csrfToken) {
                throw new Error('No se pudo obtener el token CSRF');
            }

            const { data } = await this.client.post(
                'https://spotmate.online/convert',
                { urls: url },
                {
                    headers: {
                        'Accept': '*/*',
                        'Accept-Language': 'es-419,es;q=0.9',
                        'Content-Type': 'application/json',
                        'Origin': 'https://spotmate.online',
                        'Referer': 'https://spotmate.online/en',
                        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
                        'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Linux"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'x-csrf-token': decodeURIComponent(csrfToken)
                    },
                    withCredentials: true
                }
            );

            if (!data?.url) {
                throw new Error('URL de descarga no disponible');
            }

            return data.url;
        } catch (error) {
            console.error('Error en downloadV2:', error);
            throw new Error('Error al descargar la canción');
        }
    }

    async download(url: string): Promise<SpotifyDownloadResult> {
        try {
            const { data: { result: track } } = await this.client.get<{ result: SpotifyTrack }>(
                `${this.baseUrl}/spotify/get?url=${encodeURIComponent(url)}`
            );

            const { data: { result: downloadInfo } } = await this.client.get<{ result: { download_url?: string } }>(
                `${this.baseUrl}/spotify/mp3-convert-task/${track.gid}/${track.id}`
            );

            if (!downloadInfo.download_url) {
                throw new Error('URL de descarga no disponible');
            }

            return {
                id: track.id,
                type: track.type,
                name: track.name,
                image: track.image,
                artists: track.artists,
                duration: track.duration_ms,
                download: `https://api.fabdl.com${downloadInfo.download_url}`
            };
        } catch (error) {
            console.error('Error en download:', error);
            throw new Error('Error al descargar la canción');
        }
    }
}

