import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

type DownloadResult = {
    status: boolean;
    data?: any;
    error?: any;
}

type SearchResult = {
    status: boolean;
    data?: any;
    error?: any;
}

type TrendingResult = {
    status: boolean;
    data?: any;
    error?: any;
}

export default new class Tiktok {
    private client: AxiosInstance;
    private baseUrl: string;
    private headers: Record<string, string>;

    constructor() {
        this.baseUrl = "https://tikwm.com";
        this.headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Cookie": "current_language=en",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        };
        const jar = new CookieJar();
        this.client = wrapper(axios.create({
            baseURL: this.baseUrl,
            headers: this.headers,
            jar,
            withCredentials: true
        } as any));
    }

    async download(url: string): Promise<DownloadResult> {
        if (!url) return { status: false, error: "URL is required to download." };
        try {
            const { data: { data } } = await this.client({
                method: "POST",
                url: this.baseUrl + "/api/",
                headers: this.headers,
                data: { url, hd: 1 },
            });
            return {
                status: true,
                data: {
                    id: data.id,
                    title: data.title,
                    cover: data.cover,
                    media: data.duration === 0
                        ? {
                            type: "image",
                            images: data.images,
                            image_count: data.images.length,
                        }
                        : {
                            type: "video",
                            duration: data.duration,
                            nowatermark: {
                                size: data.size,
                                play: data.play,
                                hd: {
                                    size: data.hd_size,
                                    play: data.hdplay,
                                },
                            },
                            watermark: {
                                size: data.wm_size,
                                play: data.wmplay,
                            },
                        },
                    creation: data.create_time,
                    views_count: data.play_count,
                    like_count: data.digg_count,
                    comment_count: data.comment_count,
                    share_count: data.share_count,
                    favorite_count: data.collect_count,
                    author: data.author,
                    music: data.music_info,
                },
            };
        } catch (err) {
            return { status: false, error: err };
        }
    }

    async search(query: string): Promise<SearchResult> {
        if (!query) return { status: false, error: "Query is required to search." };
        try {
            const { data: { data: { videos } } } = await this.client({
                method: "POST",
                url: this.baseUrl + "/api/feed/search/",
                headers: this.headers,
                data: {
                    keywords: query,
                    count: 20,
                    cursor: 0,
                    hd: 1,
                },
            });
            if (!videos || videos.length === 0)
                return { status: false, error: "No results found." };
            return {
                status: true,
                data: videos.map((item: any) => ({
                    id: item.video_id,
                    title: item.title,
                    cover: item.cover,
                    media: {
                        type: "video",
                        duration: item.duration,
                        nowatermark: item.play,
                        watermark: item.wmplay,
                    },
                    creation: item.create_time,
                    views_count: item.play_count,
                    like_count: item.digg_count,
                    comment_count: item.comment_count,
                    share_count: item.share_count,
                    author: item.author,
                    music: item.music_info,
                })),
            };
        } catch (err) {
            return { status: false, error: err };
        }
    }

    async trending(region: string): Promise<TrendingResult> {
        if (!region) return { status: false, error: "Region is required to search." };
        try {
            const { data: { data } } = await this.client({
                method: "POST",
                url: this.baseUrl + "/api/feed/list/",
                headers: this.headers,
                data: {
                    region,
                    count: 12,
                    cursor: 0,
                    web: 1,
                    hd: 1,
                },
            });
            return {
                status: true,
                data: data.map((item: any) => ({
                    id: item.video_id,
                    title: item.title,
                    cover: this.baseUrl + item.cover,
                    media: {
                        type: "video",
                        duration: item.duration,
                        nowatermark: this.baseUrl + item.play,
                        watermark: this.baseUrl + item.wmplay,
                    },
                    creation: item.create_time,
                    views_count: item.play_count,
                    like_count: item.digg_count,
                    comment_count: item.comment_count,
                    share_count: item.share_count,
                    author: {
                        id: item.author.id,
                        unique_id: item.author.unique_id,
                        nickname: item.author.nickname,
                        avatar: this.baseUrl + item.author.avatar,
                    },
                    music: item.music_info,
                })),
            };
        } catch (err) {
            return { status: false, error: err };
        }
    }
}