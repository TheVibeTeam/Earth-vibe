import fs from 'fs';
import Database from 'better-sqlite3';
import { performance } from 'perf_hooks';
import logger, { ILogger } from '../Utils/logger';

import * as Proto from '../../Proto/database';

export const profiling = (name: string, func: () => any) => {
    const start = performance.now()
    func()
    const end = performance.now()
    logger.info(`${name} took ${(end - start).toFixed(2)}ms`)
};

export class database {
    public logger: ILogger
    public path: string
    public data: Proto.database.ICollection
    public needProfiling: boolean
    private db: Database.Database

    /**
     * Creates a new database instance.
     *
     * @param {Object} [options] - The options to use.
     * @param {string} [options.path] - The path to the SQLite database file.
     * @param {Logger} [options.logger] - The logger to use.
     * @param {boolean} [options.needProfiling] - Whether to profile the read operation.
     */
    private constructor({ path, needProfiling }: { path: string, needProfiling: boolean }) {
        this.path = path;
        this.logger = logger;
        this.data = Proto.database.Collection.create({
            users: [],
            webserver: {
                url: process.env.WEBSERVER_URL,
                port: process.env.WEBSERVER_PORT,
                protocol: process.env.WEBSERVER_PROTOCOL,
                name: process.env.WEBSERVER_NAME,
                version: process.env.WEBSERVER_VERSION,
                description: process.env.WEBSERVER_DESCRIPTION,
                author: process.env.WEBSERVER_AUTHOR,
                license: process.env.WEBSERVER_LICENSE,
            },
            settings: {
                maintenance: process.env.MAINTENANCE as unknown as boolean,
                logger: process.env.LOGGER,
            },
        });
        this.needProfiling = needProfiling;
        const dir = require('path').dirname(path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.db = new Database(path);
        this.db.exec(`
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA temp_store = MEMORY;
            PRAGMA mmap_size = 268435456;
            PRAGMA cache_size = -64000;
            CREATE TABLE IF NOT EXISTS storage (
                id INTEGER PRIMARY KEY,
                data BLOB
            );
        `);
    }

    public static async init({ path, needProfiling }: { path: string, needProfiling: boolean }) {
        const instance = new database({ path, needProfiling });
        if (instance.needProfiling) {
            profiling('read', () => { instance.read(); });
        } else {
            await instance.read();
        }
        logger.info(`Database in archive ${path} initialized`);
        return instance;
    }

    /**
     * Reads data from the database archive.
     * If the data is already in cache, it reads from there.
     * If not, it reads from the database file.
     */
    public async read() {
        this.logger.info("Trying to decode data");
        try {
            const row: any = this.db.prepare('SELECT data FROM storage WHERE id = ?').get(1);
            if (row) {
                const buffer = row.data as Buffer;
                this.data = Proto.database.Collection.decode(buffer);
                this.logger.info(`Database in archive ${this.path} read from cache (Size: ${buffer.length} bytes)`);
            }
        } catch (error) {
            this.logger.error(error);
        }
    }

    /**
     * Writes data to the database archive.
     * If this.needProfiling is true, it will profile the write operation and log the time it took.
     * If not, it will just write.
     */
    public async write() {
        try {
            const writeOperation = () => {
                const writer = Proto.database.Collection.encode(this.data);
                const buffer = writer.finish();
                this.db.transaction(() => {
                    this.db.prepare('INSERT OR REPLACE INTO storage (id, data) VALUES (?, ?)').run(1, Buffer.from(buffer));
                })();
            }

            if (this.needProfiling) profiling('write', writeOperation);
            else await writeOperation();
            this.logger.info(`Database in archive ${this.path} written`);
        } catch (error) {
            this.logger.error(error);
        }
    }
}

export default database;