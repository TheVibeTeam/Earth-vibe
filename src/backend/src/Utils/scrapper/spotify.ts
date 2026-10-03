import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

interface Artist {
    name: string;
    type: string;
    id: string;
}

interface TrackInfo {
    id: string;
    title: string;
    duration: number;
    popularity: string;
    thumbnail: string;
    date: string;
    artist: Artist[];
    url: string;
}

interface DownloadInfo extends TrackInfo {
    download: string;
}

interface ErrorResponse {
    status: boolean;
    error: any;
}

export default class Spotify {
    public baseUrl: string;
    public jar: CookieJar;
    public client: AxiosInstance;

    constructor() {
        this.baseUrl = 'https://api.fabdl.com';
        this.jar = new CookieJar();
        this.client = wrapper(axios.create({
            jar: this.jar,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        }));
        process.env['SPOTIFY_CLIENT_ID'] = '4c4fc8c3496243cbba99b39826e2841f';
        process.env['SPOTIFY_CLIENT_SECRET'] = 'd598f89aba0946e2b85fb8aefa9ae4c8';
    }

    async spotifyCreds(): Promise<any> {
        return new Promise(async resolve => {
            await this.client.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
                headers: { Authorization: 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64') }
            }).then(({ data }) => resolve(data)).catch(resolve);
        });
    }

    async getInfo(url: string): Promise<TrackInfo> {
        return new Promise(async (resolve, reject) => {
            const creds = await this.spotifyCreds();
            if (!creds.access_token) return reject(creds);
            await this.client.get('https://api.spotify.com/v1/tracks/' + url.split('track/')[1], {
                headers: { Authorization: 'Bearer ' + creds.access_token }
            }).then(async ({ data }: { data: any }) => {
                resolve({
                    id: data.id,
                    title: data.name,
                    duration: data.duration_ms,
                    popularity: data.popularity + '%',
                    thumbnail: data.album.images.filter(({ height }: { height: number }) => height === 640).map(({ url }: { url: string }) => url)[0],
                    date: data.album.release_date,
                    artist: data.artists.map(({ name, type, id }: any) => ({ name, type, id })),
                    url: data.external_urls.spotify
                });
            }).catch(err => reject({ status: false, error: err }));
        });
    }

    async search(query: string, type: string = 'track', limit: number = 20): Promise<TrackInfo[]> {
        return new Promise(async (resolve, reject) => {
            const creds = await this.spotifyCreds();
            if (!creds.access_token) return reject(creds);
            await this.client.get('https://api.spotify.com/v1/search?query=' + query + '&type=' + type + '&offset=0&limit=' + limit, {
                headers: { Authorization: 'Bearer ' + creds.access_token }
            }).then(async ({ data: { tracks: { items } } }: { data: any }) => {
                let result: TrackInfo[] = [];
                items.map(async (data: any) => result.push({
                    id: data.id,
                    title: data.name,
                    duration: data.duration_ms,
                    popularity: data.popularity + '%',
                    thumbnail: data.album.images.filter(({ height }: { height: number }) => height === 640).map(({ url }: { url: string }) => url)[0],
                    date: data.album.release_date,
                    artist: data.artists.map(({ name, type, id }: any) => ({ name, type, id })),
                    url: data.external_urls.spotify
                }));
                resolve(result);
            }).catch(err => reject({ status: false, error: err }));
        });
    }

    async download(url: string): Promise<DownloadInfo> {
        return new Promise(async (resolve, reject) => {
            await this.getInfo(url).then(async info => {
                await this.client.get('https://spotmate.online');
                const cookies = await this.jar.getCookies('https://spotmate.online');
                const token = cookies.find(cookie => cookie.key === 'XSRF-TOKEN')?.value;
                if (!token) return reject({ status: false, error: 'CSRF Token missing' });
                await this.client.post(`https://spotmate.online/convert`, { urls: url }, {
                    headers: { 'X-XSRF-TOKEN': decodeURIComponent(token), 'Origin': 'https://spotmate.online', 'Referer': 'https://spotmate.online/' }
                }).then(async ({ data }) => {
                    resolve({
                        ...info,
                        download: data.url
                    });
                }).catch(err => reject({ status: false, error: err?.response?.data || err.message }));
            }).catch(err => reject({ status: false, error: err?.response?.data || err.message }));
        });
    }
}