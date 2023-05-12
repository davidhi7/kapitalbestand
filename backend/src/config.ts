import crypto from 'crypto';
import * as dotenv from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { SequelizeOptions } from 'sequelize-typescript';
import { fileURLToPath } from 'url';

dotenv.config();

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export function readFromEnv(name: string): string {
    if (process.env[name + '_FILE']) {
        return readFileSync(process.env[name + '_FILE'] as string, 'utf8');
    } else if (process.env[name]) {
        return process.env[name] as string;
    }
    throw Error(`Environmental variables \`${name}\` and \`${name + '_FILE'}\` mising`);
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
    db: {
        dialect: string;
        logging: boolean;
        storage?: string;
        database?: string;
        username?: string;
        password?: string;
        host?: string;
    } & SequelizeOptions;
    paths: {
        static: string;
        session_secret: string;
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
    // By default, use the in-memory sqlite option
    db: {
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false
    },
    paths: {
        static: join(projectRoot, 'static'),
        session_secret: join(projectRoot, '.session_secret')
    }
};

if (process.env.NODE_ENV !== 'test') {
    if (!process.env.DB_DBMS || !process.env.DB_DATABASE || !process.env.DB_HOST) {
        throw Error('Database configuration environmental variables are missing');
    }
    if (!(process.env.DB_DBMS === 'postgres' || process.env.DB_DBMS ===  'sqlite')) {
        throw Error(`\`DB_DBMS\` must be either \`postgres\` or \`sqlite\` (Provided: ${process.env.DB_DBMS})`);
    }
    const databaseUser = readFromEnv('DB_USER');
    const databasePassword = readFromEnv('DB_PASSWORD');
    // use persistent relational database for everything else with credentials stored in a .env file in the root directory
    config.db = {
        dialect: process.env.DB_DBMS as 'postgres' | 'sqlite',
        database: process.env.DB_DATABASE,
        username: databaseUser,
        password: databasePassword,
        host: process.env.DB_HOST,
        logging: false
    };
}

if (process.env.NODE_ENV === 'production') {
    if (!existsSync(config.paths.session_secret)) {
        writeFileSync(config.paths.session_secret, config.api.session.secret);
    } else {
        try {
            config.api.session.secret = readFileSync(config.paths.session_secret, 'utf8');
        } catch (err) {
            console.error('Failed to read session secret file');
            console.error(err);
        }
    }
}

export default config;
