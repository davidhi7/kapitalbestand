import createError from 'http-errors';
import { validationResult } from 'express-validator';

import ResponseBuilder from './response-builder.js';

export const asyncEndpointWrapper = async (req, res, next, handler) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(createError(400, `Bad request on endpoint ${req.method} ${req.baseUrl}${req.path}`, {cause: errors}));
    }
    try {
        await handler(req, res, next);
    } catch (err) {
        if (createError.isHttpError(err)) {
            return next(err);
        }
        return next(createError(500, 'Internal server error', {cause: err}));
    }
}

export const errorHandler = (error, req, res, next) => {
    try {
        if (createError.isHttpError(error)) {
            console.error(error);
            res.status(error.statusCode).json(
                ResponseBuilder({ status: 'error' })
            );
        } else {
            console.error(error);
            res.status(500).json(ResponseBuilder({ status: 'error' }));
        }
    } catch (err) {
        // send generic error in case of errors before
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};
