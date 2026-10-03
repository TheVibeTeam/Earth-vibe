import axios from "axios";
import fs from "fs";

interface Result {
    url: string;
    author: string;
    title: string;
    creation: string;
}

interface Video extends Result {
    type: "video";
    download: string;
    thumbnail?: string | null;
    duration?: number;
}

interface Image extends Result {
    type: "image";
    download: string;
}

interface Album extends Result {
    type: "image";
    images: string[];
}

type FacebookResult = Video | Image | Album;

export default class Facebook {
    private headers: Record<string, string>;

    constructor() {
        this.headers = {
            "sec-fetch-user": "?1", 
            "sec-ch-ua-mobile": "?0", 
            "sec-fetch-site": "none",
            "sec-fetch-dest": "document", 
            "sec-fetch-mode": "navigate", 
            "cache-control": "max-age=0",
            "authority": "www.facebook.com", 
            "upgrade-insecure-requests": "1",
            "accept-language": "en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6",
            "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
        };
    }

    private decode(s: string | null): string | null {
        if (!s) return null;
        try { 
            return JSON.parse(`"${s}"`); 
        } catch { 
            return s.replace(/\\"/g, '"').replace(/\\/g, ""); 
        }
    }

    async getHtml(url: string): Promise<string | null> {
        try {
            const { data } = await axios.get(url, { headers: this.headers });
            fs.writeFileSync(process.cwd() + '/facebook_last.html', data);
            return data;
        } catch (e) { 
            return null; 
        }
    }

    async download(url: string): Promise<FacebookResult> {
        return new Promise(async (resolve, reject) => {
            if (!url?.trim() || !/facebook\.com|fb\.watch/.test(url)) return reject("Invalid Facebook URL");

            try {
                const { data } = await axios.get(url, { headers: this.headers });
                const cleaned = data.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
                
                const find = (r: RegExp): string | null => { 
                    const m = cleaned.match(r); 
                    return m ? this.decode(m[1]) : null; 
                };

                let author = 
                    find(/"owner"\s*:\s*\{[^}]*?"name"\s*:\s*"([^"]+)"/) || 
                    find(/"owning_profile"\s*:\s*\{[^}]*?"name"\s*:\s*"([^"]+)"/) || 
                    find(/"creation_story"\s*:\s*\{[\s\S]*?"name"\s*:\s*"([^"]+)"/) || 
                    find(/"actors"\s*:\s*\[[\s\S]*?"name"\s*:\s*"([^"]+)"/) || 
                    find(/meta\s+property="og:title"\s+content="([^"]+)"/) || 
                    find(/<title>(.*?)<\/title>/) || 
                    "Unknown";

                if (author && (/[\d\.]+[MK]?\s+(views|reactions|likes)/i.test(author) || author.includes("&#xb7;"))) {
                    author = "Unknown";
                }

                if (author && author !== "Unknown") {
                    if (author.includes(" | ")) author = author.split(" | ")[0];
                    if (author.includes(" posted a ")) author = author.split(" posted a ")[0];
                    author = author.replace(/&#\w+;/g, ""); 
                }
                
                if (!author || author === "Unknown") author = "Facebook User";

                const title = 
                    find(/"message"\s*:\s*\{"text"\s*:\s*"((?:\\.|[^"\\])*)"/) || 
                    find(/"story"\s*:\s*\{"message"\s*:\s*\{"text"\s*:\s*"((?:\\.|[^"\\])*)"/) ||
                    find(/meta\s+name="description"\s+content="([^"]+)"/) || 
                    find(/meta\s+property="og:description"\s+content="([^"]+)"/) || 
                    "Facebook Post";

                const creationTime = find(/"creation_time"\s*:\s*(\d+)/) || find(/"publish_time"\s*:\s*(\d+)/) || "0";
                
                const result: Result = {
                    url,
                    author,
                    title,
                    creation: new Date(parseInt(creationTime) * 1000).toLocaleString()
                };

                const album = cleaned.match(/"all_subattachments"\s*:\s*\{"count":\d+,"nodes"\s*:\s*\[(.*?)\]\}/);
                if (album) {
                    const images = [...album[1].matchAll(/"viewer_image"\s*:\s*\{[^}]*?"uri"\s*:\s*"([^"]+)"/g)].map(m => this.decode(m[1]));
                    if (!images.length) [...album[1].matchAll(/"image"\s*:\s*\{[^}]*?"uri"\s*:\s*"([^"]+)"/g)].forEach(m => images.push(this.decode(m[1])));
                    
                    // Filtramos nulos y aseguramos que sea un array de strings
                    const validImages = [...new Set(images)].filter((img): img is string => img !== null);
                    
                    if (validImages.length) return resolve({ ...result, type: "image", images: validImages });
                }

                const hd = find(/"browser_native_hd_url"\s*:\s*"([^"]+)"/) || 
                           find(/"playable_url_quality_hd"\s*:\s*"([^"]+)"/) || 
                           find(/"progressive_url"\s*:\s*"([^"]+)"[^}]*?"quality"\s*:\s*"HD"/);
                           
                const sd = find(/"browser_native_sd_url"\s*:\s*"([^"]+)"/) || 
                           find(/"playable_url"\s*:\s*"([^"]+)"/) || 
                           find(/"progressive_url"\s*:\s*"([^"]+)"[^}]*?"quality"\s*:\s*"SD"/) ||
                           find(/"progressive_url"\s*:\s*"([^"]+)"/) || 
                           find(/meta\s+property="og:video"\s+content="([^"]+)"/);

                if (sd || hd) {
                    const durationStr = find(/"playable_duration_in_ms"\s*:\s*(\d+)/);
                    return resolve({
                        ...result, 
                        type: "video", 
                        download: (hd || sd) as string,
                        thumbnail: find(/"preferred_thumbnail"\s*:\s*\{"image"\s*:\s*\{"uri"\s*:\s*"([^"]+)"/) || find(/property="og:image"\s+content="([^"]+)"/),
                        duration: durationStr ? parseInt(durationStr) : 0
                    });
                }

                const img = find(/"photo_image"\s*:\s*\{[^}]*?"uri"\s*:\s*"([^"]+)"/) || 
                            find(/"comet_photo_attachment_resolution_renderer"\s*:\s*\{[^}]*"image"\s*:\s*\{"uri"\s*:\s*"([^"]+)"/) || 
                            find(/property="og:image"\s+content="([^"]+)"/);
                            
                if (img) return resolve({ ...result, type: "image", download: img });

                reject("Content not found (private/deleted)");
            } catch (e: any) { 
                reject(`Error: ${e.message}`); 
            }
        });
    }
}