import { query } from 'express-validator';

import config from '../config.js';

export const limitValidator = query('limit')
    .isInt({ max: config['api']['query']['payload_limit'] })
    .toInt()
    .default(config['api']['query']['payload_limit'])
    .optional();
export const offsetValidator = query('offset').isInt().toInt().default(0).optional();
