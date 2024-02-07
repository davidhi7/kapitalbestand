import crypto from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ParseArgsConfig, parseArgs } from 'node:util';
import { dirname, join } from 'path';
import { SequelizeOptions } from 'sequelize-typescript';
import { fileURLToPath } from 'url';

export function readFromEnv(name: string): string {
    if (process.env[name + '_FILE']) {
        return readFileSync(process.env[name + '_FILE'] as string, 'utf8').trim();
    } else if (process.env[name]) {
        return process.env[name] as string;
    }
    throw Error(`Environmental variables \`${name}\` and \`${name + '_FILE'}\` missing`);
}

function populateDatabaseConfig(config: ConfigType, use_memory_sqlite: boolean, enable_orm_logging: boolean) {
    if (use_memory_sqlite || process.env.USE_MEMORY_SQLITE) {
        console.log('Use sqlite database inside memory');
        config.db = {
            dialect: 'sqlite',
            storage: ':memory:',
            logging: enable_orm_logging
        };
        return;
    }
    
    if (!process.env.DB_DBMS || !process.env.DB_DATABASE || !process.env.DB_HOST) {
        throw Error('Database configuration environmental variables are missing');
    }
    if (!(process.env.DB_DBMS === 'postgres' || process.env.DB_DBMS === 'sqlite')) {
        throw Error(`\`DB_DBMS\` must be \`postgres\` (provided: ${process.env.DB_DBMS})`);
    }
    config.db = {
        dialect: process.env.DB_DBMS as 'postgres' | 'sqlite',
        database: process.env.DB_DATABASE,
        username: readFromEnv('DB_USER'),
        password: readFromEnv('DB_PASSWORD'),
        host: process.env.DB_HOST,
        logging: enable_orm_logging
    };
}

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
let use_memory_sqlite = false;
let enable_orm_logging = false;
if (process.env.NODE_ENV !== "test") {
    const parseArgsOptions: ParseArgsConfig = {
        options: {
            'memory-sqlite': {
                type: 'boolean',
                default: false
            },
            orm_logging: {
                type: 'boolean',
                default: false
            }
        }
    };
    const CliValues = parseArgs(parseArgsOptions).values;
    use_memory_sqlite = CliValues['memory-sqlite'] as boolean;
    enable_orm_logging = CliValues['orm-logging'] as boolean;    
}

type ConfigType = {
    api: {
        query: {
            payload_limit: number;
        };
        session: {
            secret: string;
        };
    };
    db?: {
        dialect: string;
        logging: boolean;
        storage?: string;
        database?: string;
        username?: string;
        password?: string;
        host?: string;
    } & SequelizeOptions;
    paths: {
        static_directory: string;
        session_secret_file: string;
    };
};

const config: ConfigType = {
    api: {
        query: {
            payload_limit: 10000
        },
        session: {
            secret: crypto.randomBytes(32).toString('hex')
        }
    },
    paths: {
        static_directory: join(projectRoot, 'static'),
        session_secret_file: join(projectRoot, '.session_secret')
    }
};

populateDatabaseConfig(config, use_memory_sqlite, enable_orm_logging)

if (process.env.NODE_ENV === 'production') {
    if (!existsSync(config.paths.session_secret_file)) {
        writeFileSync(config.paths.session_secret_file, config.api.session.secret);
    } else {
        try {
            config.api.session.secret = readFileSync(config.paths.session_secret_file, 'utf8');
        } catch (err) {
            console.error('Failed to read session secret file');
            console.error(err);
        }
    }
}

export default config;
