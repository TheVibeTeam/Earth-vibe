import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { Storage as GCStorage } from '@google-cloud/storage';
import logger from './logger';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);
const readdir = promisify(fs.readdir);

const STORAGE_DIR = path.join(process.cwd(), 'Storage');
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
const ABSOLUTE_STORAGE_DIR = path.resolve(STORAGE_DIR);
const CATEGORIES = ['images', 'videos', 'documents', 'rewards'];

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_CLOUD_RUN = process.env.K_SERVICE !== undefined;
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'auralix-uploads';
const GCS_PROJECT_ID = process.env.GCP_PROJECT_ID || 'pro-platform-470721-v2';

let gcsStorage: GCStorage | null = null;
let gcsBucket: any = null;

interface UploadOptions {
    userId: string;
    category?: 'images' | 'videos' | 'documents' | 'rewards';
    originalName?: string;
}

interface UploadBufferOptions extends UploadOptions {
    mimeType?: string;
    extension?: string;
}

interface UploadResponse {
    url: string;
    filename: string;
    path: string;
}

interface StorageStats {
    totalFiles: number;
    categories: Record<string, number>;
}

export default class Storage {

    static async init(): Promise<void> {
        try {
            if (IS_PRODUCTION || IS_CLOUD_RUN) {
                gcsStorage = new GCStorage({ projectId: GCS_PROJECT_ID });
                gcsBucket = gcsStorage.bucket(GCS_BUCKET_NAME);
                logger.info(`GCS initialized: ${GCS_BUCKET_NAME}`);
            } else {
                await Promise.all(
                    [STORAGE_DIR, UPLOADS_DIR, ...CATEGORIES.map(cat => path.join(UPLOADS_DIR, cat))]
                    .map(dir => mkdir(dir, { recursive: true }))
                );
                logger.info('Local storage initialized');
            }
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Storage init failed:');
            if (!IS_PRODUCTION && !IS_CLOUD_RUN) throw error;
        }
    }

    private static async _saveFile(
        buffer: Buffer,
        userId: string,
        category: string,
        extension: string
    ): Promise<UploadResponse> {
        const filename = `${userId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${extension}`;
        const filePath = `${category}/${filename}`;

        if (IS_PRODUCTION || IS_CLOUD_RUN) {
            if (!gcsBucket) throw new Error('GCS bucket not initialized');

            const file = gcsBucket.file(filePath);
            await file.save(buffer, {
                metadata: {
                    contentType: this.getMimeType(extension),
                    cacheControl: 'public, max-age=31536000'
                }
            });
            await file.makePublic();

            const url = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filePath}`;
            logger.info(`GCS upload: ${url}`);
            return { url, filename, path: filePath };
        } else {
            const localFilePath = path.join(UPLOADS_DIR, category, filename);
            await writeFile(localFilePath, buffer);
            const url = `/uploads/${category}/${filename}`;
            logger.info(`Local upload: ${url}`);
            return { url, filename, path: localFilePath };
        }
    }

    static async uploadBase64(base64Data: string, options: UploadOptions): Promise<UploadResponse> {
        try {
            const { userId, category = 'images' } = options;
            const base64String = base64Data.replace(/^data:.*;base64,/, '');
            const buffer = Buffer.from(base64String, 'base64');
            const ext = this.getExtensionFromMime(base64Data) || 'bin';
            return this._saveFile(buffer, userId, category, ext);
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Upload base64 error:');
            throw new Error('Failed to upload file');
        }
    }

    static async uploadBuffer(buffer: Buffer, options: UploadBufferOptions): Promise<UploadResponse> {
        try {
            const { userId, category = 'images', extension = 'bin' } = options;
            return this._saveFile(buffer, userId, category, extension);
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Upload buffer error:');
            throw new Error('Failed to upload file');
        }
    }

    static async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            if (IS_PRODUCTION || IS_CLOUD_RUN) {
                if (!gcsBucket) throw new Error('GCS bucket not initialized');
                const gcsPath = fileUrl.replace(`https://storage.googleapis.com/${GCS_BUCKET_NAME}/`, '');
                await gcsBucket.file(gcsPath).delete();
                logger.info(`GCS delete: ${gcsPath}`);
                return true;
            } else {
                await unlink(this.getFilePath(fileUrl));
                logger.info(`Local delete: ${fileUrl}`);
                return true;
            }
        } catch (error: any) {
            if (error.code === 'ENOENT' || error.code === 404 || error.message === 'Invalid file path') {
                logger.warn(`File not found: ${fileUrl}`);
            } else {
                logger.error('Delete error:', error);
            }
            return false;
        }
    }

    static getFilePath(fileUrl: string): string {
        const urlPath = fileUrl.replace(/^\//, '');
        const absoluteFilePath = path.resolve(ABSOLUTE_STORAGE_DIR, urlPath);
        if (!absoluteFilePath.startsWith(ABSOLUTE_STORAGE_DIR) || urlPath.includes('\0') || urlPath.includes('..')) {
            throw new Error('Invalid file path');
        }
        return absoluteFilePath;
    }

    static async fileExists(fileUrl: string): Promise<boolean> {
        try {
            await access(this.getFilePath(fileUrl));
            return true;
        } catch {
            return false;
        }
    }

    static async getStorageStats(): Promise<StorageStats> {
        try {
            const categoryCounts = await Promise.all(
                CATEGORIES.map(async (category) => {
                    try {
                        const files = await readdir(path.join(UPLOADS_DIR, category));
                        return { name: category, count: files.length };
                    } catch (error: any) {
                        if (error.code !== 'ENOENT') logger.warn(`Could not read ${category}: ${error.message}`);
                        return { name: category, count: 0 };
                    }
                })
            );

            const stats: Record<string, number> = {};
            let totalFiles = 0;
            for (const item of categoryCounts) {
                stats[item.name] = item.count;
                totalFiles += item.count;
            }
            return { totalFiles, categories: stats };
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Storage stats error:');
            return { totalFiles: 0, categories: {} };
        }
    }

    private static getMimeType(extension: string): string {
        const mimes: Record<string, string> = {
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
            'gif': 'image/gif', 'webp': 'image/webp', 'mp4': 'video/mp4',
            'webm': 'video/webm', 'ogg': 'video/ogg', 'pdf': 'application/pdf', 'txt': 'text/plain'
        };
        return mimes[extension.toLowerCase()] || 'application/octet-stream';
    }

    private static getExtensionFromMime(dataUrl: string): string | null {
        const match = dataUrl.match(/^data:([^;]+);/);
        if (!match) return null;
        const mimes: Record<string, string> = {
            'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
            'image/gif': 'gif', 'image/webp': 'webp', 'video/mp4': 'mp4',
            'video/webm': 'webm', 'video/ogg': 'ogg', 'application/pdf': 'pdf', 'text/plain': 'txt'
        };
        return mimes[match[1]] || null;
    }
}