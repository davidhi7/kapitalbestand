import express from 'express';
import { ValidationChain, param } from 'express-validator';
import { Model } from 'sequelize-typescript';

import { User } from '../../database/db.js';
import { AuthenticatedRequest } from '../authenticatedSession.js';
import { limitValidator, offsetValidator } from '../common.js';
import { asyncEndpointWrapper } from '../error-handling.js';
import ResponseBuilder from '../response-builder.js';

type ValidatorArray = Array<ValidationChain>;

type CreateHandler<CreateParameters> = (user: User, body: CreateParameters) => Promise<Model>;
type FetchHandler<FetchParameters> = (
    user: User,
    limit: number,
    offset: number,
    query: FetchParameters
) => Promise<Model[]>;
type UpdateHandler<CreateParameters> = (
    user: User,
    id: number,
    body: CreateParameters
) => Promise<Model>;
type DeleteHandler = (user: User, id: number) => Promise<void>;
type GetByIdHandler = (user: User, id: number) => Promise<Model>;

const idValidator = param('id').isInt({ min: 0 }).toInt();

export class EndpointBuilder<CreateParameters, FetchParameters> {
    router: express.Router;

    constructor() {
        this.router = express.Router();
    }

    post(validators: ValidatorArray, handler: CreateHandler<CreateParameters>) {
        this.router.post('/', ...validators, (req, res, next) => {
            asyncEndpointWrapper(req, res, next, async () => {
                res.status(201).json(
                    ResponseBuilder({
                        status: 'success',
                        data: await handler((req as AuthenticatedRequest).session.user, req.body)
                    })
                );
            });
        });

        return this;
    }

    get(validators: ValidatorArray, handler: FetchHandler<FetchParameters>) {
        this.router.get('/', limitValidator, offsetValidator, ...validators, (req, res, next) => {
            asyncEndpointWrapper(req, res, next, async () => {
                res.json(
                    ResponseBuilder({
                        status: 'success',
                        data: await handler(
                            (req as AuthenticatedRequest).session.user,
                            req.query!.limit,
                            req.query!.offset,
                            req.query as FetchParameters
                        )
                    })
                );
            });
        });

        return this;
    }

    patch(validators: ValidatorArray, handler: UpdateHandler<CreateParameters>) {
        this.router.patch('/:id', ...validators, idValidator, (req, res, next) => {
            asyncEndpointWrapper(req, res, next, async () => {
                res.json(
                    ResponseBuilder({
                        status: 'success',
                        data: await handler(
                            (req as AuthenticatedRequest).session.user,
                            req.params!.id,
                            req.body
                        )
                    })
                );
            });
        });

        return this;
    }

    delete(handler: DeleteHandler) {
        this.router.delete('/:id', idValidator, (req, res, next) => {
            asyncEndpointWrapper(req, res, next, async () => {
                await handler((req as AuthenticatedRequest).session.user, req.params!.id);
                res.json(ResponseBuilder({ status: 'success' }));
            });
        });

        return this;
    }

    getId(handler: GetByIdHandler) {
        this.router.get('/:id', idValidator, (req, res, next) => {
            asyncEndpointWrapper(req, res, next, async () => {
                res.json(
                    ResponseBuilder({
                        status: 'success',
                        data: await handler(
                            (req as AuthenticatedRequest).session.user,
                            req.params!.id
                        )
                    })
                );
            });
        });

        return this;
    }

    getRouter(): express.Router {
        return this.router;
    }
}
