import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import fs from "fs";

interface Author {
    username: string;
    profile_pic_url: string;
    id: string;
    is_verified: boolean;
}

interface Media {
    url: string;
    type: "video" | "image" | "audio";
    width?: number;
    height?: number;
}

interface Result {
    status: boolean;
    title: string;
    likes: number;
    repost: number;
    reshare: number;
    comments: number;
    creation: number;
    author: Author;
}

interface Thread extends Result {
    download: Media | Media[];
}

interface Failure {
    status: false;
    url: string;
}

type ParseFunction = (str: string | null | undefined) => string;

export default class Threads {
    public baseUrl: string;
    public jar: CookieJar;
    public client: AxiosInstance;
    private parse: ParseFunction;

    constructor() {
        this.baseUrl = 'https://www.threads.net';
        this.jar = new CookieJar();
        this.client = wrapper(axios.create({
            jar: this.jar,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        }));

        this.parse = (str) => {
            const esc: { [key: string]: string } = { '"': '\\"', '\n': '\\n', '\r': '\\r', '\t': '\\t' };
            return JSON.parse(`{"text": "${(str || "").replace(/["\n\r\t]/g, c => esc[c])}"}`).text;
        };
    }

    download(url: string): Promise<Thread | Failure> {
        return new Promise((resolve, reject) => {
            this.client.get(url, {
                headers: {
                    "sec-fetch-user": "?1",
                    "sec-ch-ua-mobile": "?0",
                    "sec-fetch-site": "none",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "cache-control": "max-age=0",
                    "authority": "www.threads.net",
                    "upgrade-insecure-requests": "1",
                    "accept-language": "en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6",
                    "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
                }
            }).then(({ data }: { data: string }) => {
                const cleaned = (() => {
                    const start = data.indexOf('"thread_items":');
                    if (start === -1) return null;
                    const a = data.indexOf('[', start);
                    let c = 1, i = a + 1;
                    while (i < data.length && c) {
                        c += data[i] === '[' ? 1 : data[i] === ']' ? -1 : 0;
                        i++;
                    }
                    return data.slice(a, i);
                })()

                if (!cleaned) return resolve({ status: false, url });

                const threads: any = JSON.parse(cleaned)[0].post;

                fs.writeFileSync("t.json", JSON.stringify(threads, null, 2), "utf8");

                const result: Result = {
                    status: true,
                    title: this.parse(threads.caption ? threads.caption?.text : "unknown"),
                    likes: threads.like_count,
                    repost: threads.text_post_app_info.repost_count,
                    reshare: threads.text_post_app_info.reshare_count,
                    comments: threads.text_post_app_info.direct_reply_count,
                    creation: threads.taken_at,
                    author: {
                        username: threads.user.username,
                        profile_pic_url: threads.user.profile_pic_url,
                        id: threads.user.id,
                        is_verified: threads.user.is_verified || false
                    }
                };

                if (threads.video_versions) {
                    return resolve({
                        ...result,
                        download: {
                            type: "video",
                            width: +threads.original_width,
                            height: +threads.original_height,
                            url: threads.video_versions[1].url
                        }
                    });
                }

                if (threads.audio) {
                    return resolve({
                        ...result,
                        download: {
                            type: "audio",
                            url: threads.audio.audio_src
                        }
                    });
                }

                if (threads.carousel_media) {
                    const media: Media[] = threads.carousel_media.map((item: any) => {
                        let type: "video" | "image" | "audio" | undefined, url: string | undefined, height: number | undefined, width: number | undefined;

                        if (item.image_versions2) {
                            url = item.image_versions2.candidates[0].url;
                            type = "image";
                            width = item.image_versions2.candidates[0].width;
                            height = item.image_versions2.candidates[0].height;
                        }
                        if (item.video_versions) {
                            url = item.video_versions[1].url;
                            type = "video";
                            width = item.original_width;
                            height = item.original_height;
                        }

                        if (!url || !type) return null;

                        return {
                            url,
                            type,
                            width,
                            height
                        };
                    }).filter((item: Media | null) => item !== null);

                    return resolve({ ...result, download: media });
                }

                if (threads.image_versions2) {
                    return resolve({
                        ...result,
                        download: {
                            url: threads.image_versions2.candidates[0].url,
                            type: "image",
                            width: threads.image_versions2.candidates[0].width,
                            height: threads.image_versions2.candidates[0].height
                        }
                    });
                }

                resolve({ status: false, url });
            }).catch(reject);
        });
    }
}