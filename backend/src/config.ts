import crypto from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ParseArgsConfig, parseArgs } from 'node:util';
import { dirname, join } from 'path';
import { SequelizeOptions } from 'sequelize-typescript';
import { fileURLToPath } from 'url';

export function readFromEnv(name: string, allowSecretFile: boolean = false): string {
    if (allowSecretFile && process.env[name + '_FILE']) {
        return readFileSync(process.env[name + '_FILE'] as string, 'utf8').trim();
    } else if (process.env[name]) {
        return process.env[name] as string;
    }

    let errorString = `Environmental variable \`${name}\` missing`;
    if (allowSecretFile) {
        errorString = `Environmental variables \`${name}\` and \`${name + '_FILE'}\` missing`;
    }
    throw Error(errorString);
}

function populateDatabaseConfig(enable_orm_logging: boolean): SequelizeOptions {
    if (!process.env.DB_DBMS || !process.env.DB_DATABASE || !process.env.DB_HOST) {
        throw Error('Database configuration environmental variables are missing');
    }
    if (!(process.env.DB_DBMS === 'postgres')) {
        throw Error(`\`DB_DBMS\` must be \`postgres\` (provided: ${process.env.DB_DBMS})`);
    }
    return {
        dialect: readFromEnv('DB_DBMS') as 'postgres',
        database: readFromEnv('DB_DATABASE'),
        username: readFromEnv('DB_USER', true),
        password: readFromEnv('DB_PASSWORD', true),
        host: readFromEnv('DB_HOST'),
        logging: enable_orm_logging
    };
}

let enable_orm_logging = false;
if (process.env.NODE_ENV !== 'test') {
    const parseArgsOptions: ParseArgsConfig = {
        options: {
            'orm-logging': {
                type: 'boolean',
                default: false
            }
        }
    };
    const cliValues = parseArgs(parseArgsOptions).values;
    enable_orm_logging = cliValues['orm-logging'] as boolean;
}

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = {
    api: {
        query: {
            payload_limit: 10000
        },
        session: {
            secret: crypto.randomBytes(32).toString('hex')
        }
    },
    db: populateDatabaseConfig(enable_orm_logging),
    paths: {
        static_directory: join(projectRoot, 'static')
    }
};

if (process.env.NODE_ENV === 'production') {
    const session_secret_file = join(projectRoot, '.session_secret')
    if (!existsSync(session_secret_file)) {
        writeFileSync(session_secret_file, config.api.session.secret);
    } else {
        try {
            config.api.session.secret = readFileSync(session_secret_file, 'utf8');
        } catch (err) {
            console.error('Failed to read session secret file');
            console.error(err);
        }
    }
}

export default config;
