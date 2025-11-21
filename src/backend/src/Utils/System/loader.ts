import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import logger from '../logger';
import GraphQLSchema from '../../../GraphQL/index';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const resolve = path.resolve;

export default new class Loader {
    public plugins: Record<string, any> = {}
    public sockets: Record<string, any> = {}
    public graphql: {
        queries: Record<string, any>,
        mutations: Record<string, any>,
        subscriptions: Record<string, any>,
        schemas: string[]
    } = {
        queries: {},
        mutations: {},
        subscriptions: {},
        schemas: []
    }

    public async router(dir: string): Promise<void> {
        const files = await this.scandir(dir);
        const entries: [string, any][] = [];
        for (const file of files) {
            if (file.endsWith('.ts') || file.endsWith('.js')) {
                const name = path.basename(file).replace(/\.(ts|js)$/, '');
                try {
                    const mod = await import(file);
                    entries.push([name, mod.default || mod]);
                    logger.info({ file, name }, 'Route loaded successfully');
                } catch (err: any) {
                    logger.error({ file, error: err.message }, 'Error importing router');
                }
            }
        }
        this.plugins = Object.fromEntries(entries);
    }

    public async socket(dir: string): Promise<void> {
        const files = await this.scandir(dir);
        const entries: [string, any][] = [];
        for (const file of files) {
            if (file.endsWith('.ts') || file.endsWith('.js')) {
                const name = path.basename(file).replace(/\.(ts|js)$/, '');
                try {
                    const mod = await import(file);
                    entries.push([name, mod.default || mod]);
                    logger.info({ file, name }, 'Socket loaded successfully');
                } catch (err: any) {
                    logger.error({ file, error: err.message }, 'Error importing socket');
                }
            }
        }
        this.sockets = Object.fromEntries(entries);
    }

    public async graphqlResolvers(dir: string): Promise<void> {
        // Carga el schema generado desde GraphQL/index (importado estáticamente como Proto)
        try {
            const typeDefs = GraphQLSchema;
            if (typeDefs && typeof typeDefs === 'string' && !this.graphql.schemas.includes(typeDefs)) {
                this.graphql.schemas.push(typeDefs);
                logger.info({ schemasCount: this.graphql.schemas.length }, 'Loaded GraphQL schema from generated module');
            } else {
                logger.warn({ typeofSchema: typeof typeDefs }, 'GraphQL schema is not a string');
            }
        } catch (err: any) {
            logger.error({ error: err.message, stack: err.stack }, 'Error loading GraphQL schema module');
        }

        // Carga los resolvers desde el directorio Hybrid
        const files = await this.scandir(dir);
        for (const file of files) {
            if (file.endsWith('.ts') || file.endsWith('.js')) {
                const name = path.basename(file).replace(/\.(ts|js)$/, '');
                const relativePath = path.relative(dir, file);
                const category = path.dirname(relativePath).split(path.sep)[0];
                
                try {
                    const mod = await import(file);
                    const resolver = mod.default || mod;
                    
                    if (resolver.type === 'query') {
                        this.graphql.queries[name] = resolver;
                    } else if (resolver.type === 'mutation') {
                        this.graphql.mutations[name] = resolver;
                    } else if (resolver.type === 'subscription') {
                        this.graphql.subscriptions[name] = resolver;
                    }
                    
                    logger.info({ file, name, type: resolver.type, category }, 'GraphQL resolver loaded successfully');
                } catch (err: any) {
                    logger.error({ file, error: err.message }, 'Error importing GraphQL resolver');
                }
            }
        }
    }

    private async scandir(dir: string): Promise<string[]> {
        const subdirs = await readdir(dir);
        const files = await Promise.all(subdirs.map(async (subdir) => {
            const res = resolve(dir, subdir);
            try {
                return (await stat(res)).isDirectory() ? this.scandir(res) : res;
            } catch (err: any) {
                logger.error({ dir: res, error: err.message }, 'Error reading directory');
                return [];
            }
        }));
        return files.flat();
    }
}