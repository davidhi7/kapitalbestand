import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import createError from 'http-errors';
import argon2 from 'argon2';
import { body } from 'express-validator';

import { User } from '../database/db.js';
import { asyncEndpointWrapper } from './error-handling.js';
import ResponseBuilder from './response-builder.js';
import config from '../config.js';

const setAuthenticated = (req, res, next) => {
    /**
     * Set the request session as authenticated by setting the authentication flag to true and setting the user by accessing `res.locals.user`.
     */
    if (!res.locals.user) {
        throw createError['500']();
    }
    req.session.regenerate(function (err) {
        if (err) {
            throw createError['500']();
        }
        req.session.authenticated = true;
        req.session.user = res.locals.user;

        next();
    });
};

const sendSessionData = (req, res) => {
    /**
     * Send a response containing the session timeout, the associated username and optionally other values stored in `res.locals.data`
     */
    // session.maxAge returns the remaining time in ms
    const sessionTimeoutStamp = Date.now() + req.session.cookie.maxAge;
    const data = res.locals.data || {};
    data.sessionTimeout = sessionTimeoutStamp;
    data.username = req.session.user.username;
    res.status(res.locals.status || 200).json(ResponseBuilder({ status: 'success', data: data }));
};

const router = express.Router();

router.use(
    session({
        secret: config.api.session.secret,
        name: 'sid',
        cookie: {
            maxAge: 60 * 60 * 1000,
            // secure: process.env.NODE_ENV === 'production',
            // using a reverse proxy, this is not required
            // TODO: config option?
            secure: false,
            httpOnly: true
        },
        store: new (MemoryStore(session))({
            checkPeriod: 86400000 // prune expired entries every 24h
        }),

        // TODO: research on these options
        resave: false,
        saveUninitialized: false
    })
);

router.post(
    '/auth/register',
    body('username').notEmpty(),
    body('password').isLength({ min: 8 }),
    (req, res, next) =>
        asyncEndpointWrapper(req, res, next, async () => {
            const { username, password } = req.body;

            const query = await User.scope('with_hash').findOne({
                where: { username }
            });
            if (query !== null) {
                throw new createError[403]();
            }

            const instance = await User.create({
                username: username,
                hash: await argon2.hash(password)
            });

            res.locals.user = instance;
            res.locals.status = 201;
            next();
        }),
    setAuthenticated,
    sendSessionData
);

router.post(
    '/auth/login',
    body('username').notEmpty(),
    body('password').notEmpty(),
    (req, res, next) =>
        asyncEndpointWrapper(req, res, next, async () => {
            const { username, password } = req.body;

            const userInstance = await User.scope('with_hash').findOne({
                where: { username }
            });
            if (!userInstance) {
                throw new createError[403]();
            }

            try {
                if (await argon2.verify(userInstance.hash, password)) {
                    res.locals.user = userInstance;
                    next();
                } else {
                    throw new createError[403]();
                }
            } catch (err) {
                throw new createError[403]();
            }
        }),
    setAuthenticated,
    sendSessionData
);

// require authenticated users from here on
router.use((req, res, next) => {
    if (!req.session.authenticated) {
        return next(createError[401]());
    }
    next();
});

router.get(
    '/auth/refresh',
    (req, res, next) => {
        res.locals.user = req.session.user;
        req.session.regenerate(function (err) {
            if (err) {
                throw createError['500']();
            }
            next();
        });
    },
    setAuthenticated,
    sendSessionData
);

router.get('/auth/logout', (req, res) => {
    req.session.destroy(function (err) {
        if (err) {
            throw createError['500']();
        }
        res.status(200).json(ResponseBuilder({ status: 'success' }));
    });
});

router.get('/auth/whoami', sendSessionData);

export default router;
