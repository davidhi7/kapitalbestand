import crypto from 'crypto';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

import * as dotenv from 'dotenv';
dotenv.config();

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');


const config = {
    api: {
        query: {
            payload_limit: 10000
        },
        session: {

        }
    },
    db: {},
    paths: {
        static: join(projectRoot, 'static'),
        session_secret: join(projectRoot, '.session_secret')
    }
};

if (process.env.NODE_ENV === 'test') {
    // use in-memory sqlite for testing
    config.db = {
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false
    }
} else {
    // use persistent relational database for everything else with credentials stored in a .env file in the root directory
    config.db = {
        dialect: process.env.DB_DBMS,
        database: process.env.DB_DATABASE,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        logging: false
    }
}

let secret = crypto.randomBytes(32).toString('hex');
if (process.env.NODE_ENV === 'production') {
    if (!existsSync(config.paths.session_secret)) {
        writeFileSync(config.paths.session_secret, secret);
    } else {
        try {
            secret = readFileSync(config.paths.session_secret, 'utf8');
        } catch (err) {
            console.error('Failed to read session secret file');
            console.error(err);
        }
    }
}
config.api.session.secret = secret;

export default config;
