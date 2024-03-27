import { expect } from 'chai';
import express from 'express';
import { body, check } from 'express-validator';
import httpError from 'http-errors';
import sinon from 'sinon';
import request from 'supertest';

import { asyncEndpointWrapper, errorHandler } from './error-handling.js';

describe('asyncEndpointWrapper', () => {
    const app = express();
    app.use(express.json());
    let errorHandlerSpy;

    app.all('/', (req, res, next) =>
        asyncEndpointWrapper(req, res, next, () => {
            res.send();
        })
    );
    app.all('/requireParameter', body('int').isInt().toInt(), (req, res, next) => {
        asyncEndpointWrapper(req, res, next, () => {
            res.send();
        });
    });
    app.all('/throwError', (req, res, next) => {
        asyncEndpointWrapper(req, res, next, () => {
            throw new Error('Things went wrong');
        });
    });

    beforeEach(() => {
        // set up 'error handler' spy for testing the errors
        errorHandlerSpy = sinon.spy((err, req, res, next) => {
            res.status(err.status).json(err);
        });
        app.use(errorHandlerSpy);
    });

    afterEach(() => {
        app._router.stack.pop();
    });

    it('should throw nothing if no parameters are required', async () => {
        await request(app).get('/').expect(200);
        expect(errorHandlerSpy.notCalled);
    });
    it('should throw nothing if required parameter are given', async () => {
        await request(app).post('/requireParameter').send({ int: 1 }).expect(200);
        expect(errorHandlerSpy.notCalled);
    });
    it('should throw a 400 BadRequestError after failed validation and pass it to the error handling middleware', async () => {
        await request(app).post('/requireParameter').expect(400);

        expect(errorHandlerSpy.calledOnce);

        const error = errorHandlerSpy.getCall(0).args[0];
        expect(httpError.isHttpError(error)).to.be.true;
        expect(error.cause.errors).to.deep.equal([
            {
                value: undefined,
                msg: 'Invalid value',
                param: 'int',
                location: 'body'
            }
        ]);
    });
    it('should throw a 500 InternalServerError after internally raised exception and pass it to the error handling middleware', async () => {
        await request(app).get('/throwError').expect(500);

        expect(errorHandlerSpy.calledOnce);

        const error = errorHandlerSpy.getCall(0).args[0];
        expect(httpError.isHttpError(error)).to.be.true;
        expect(error.cause.message).to.equal('Things went wrong');
    });
});

describe('errorHandler', () => {
    // TODO test error handling
});
