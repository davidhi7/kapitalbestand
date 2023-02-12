import express from 'express';
import { body, query, param } from 'express-validator';
import createError from 'http-errors';

import ResponseBuilder from '../response-builder.js';
import OneoffTransactionController from '../../controllers/transaction/one-off-transaction-controller.js';
import MonthlyTransactionController from '../../controllers/transaction/monthly-transaction-controller.js';
import { categoryShopIdResolver } from '../../controllers/category-shop/AuxDataController.js';
import { asyncEndpointWrapper } from '../error-handling.js';


const router = express.Router();

const checkDateLowerThan = (dateFrom, dateTo) => {
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
        return Promise.reject(new Error('Lower limit is higher than upper limit'));
    }
    return true;
};

const checkNumberLowerThan = (numberFrom, numberTo) => {
    if (numberFrom && numberTo && Number(numberFrom) > Number(numberTo)) {
        return Promise.reject(new Error('Lower limit is higher than upper limit'));
    }
    return true;
}

const categoryShopIdResolveMiddleware = async (req, res, next) => {
    req.body = await categoryShopIdResolver(req.session.user, req.body);
    next();
}

router.get('/oneoff',
    query('isExpense')  .isBoolean().toBoolean().optional(),
    query('dateFrom')   .isDate().custom((dateFrom, { req }) => checkDateLowerThan(dateFrom, req.query.dateTo)).toDate().optional(),
    query('dateTo')     .isDate().toDate().optional(),
    query('amountFrom') .isInt().toInt().custom((amountFrom, { req }) => checkNumberLowerThan(amountFrom, req.query.amountTo)).optional(),
    query('amountTo')   .isInt().toInt().optional(),
    query('CategoryId') .isInt().toInt().optional(),
    query('ShopId')     .isInt().toInt().optional(),
    query('limit')      .isInt().toInt().optional(),
    query('offset')     .isInt().toInt().optional(),
    async (req, res, next) => asyncEndpointWrapper(req, res, next, async () => {
        const data = await OneoffTransactionController.fetch(req.session.user, req.query);
        res.json(ResponseBuilder({status: 'success', data: data}));
    })
);

router.get('/oneoff/:id',
    param('id').isInt({min: 0}).toInt(),
    (req, res, next) => asyncEndpointWrapper(req, res, next, async () => {
        const instance = await OneoffTransactionController.getByUserAndId(req.session.user, req.params.id);
        res.json(ResponseBuilder({status: 'success', data: instance}));
    })
);

router.post('/oneoff', 
    body('isExpense')   .isBoolean().toBoolean(),
    body('date')        .isISO8601({ strict: true }).toDate(),
    body('amount')      .isInt({ gt: 0 }).toInt(),
    categoryShopIdResolveMiddleware,
    body('CategoryId')  .isInt().toInt(),
    body('ShopId')      .isInt().toInt().optional({nullable: true}),
    (req, res, next) => asyncEndpointWrapper(req, res, next, async () => {
        const result = await OneoffTransactionController.create(req.session.user, req.body);
        res.status(201).json(ResponseBuilder({status: 'success', data: result}));
    })
);

router.delete('/oneoff/:id',
    param('id').isInt({min: 0}).toInt(),
    (req, res, next) => asyncEndpointWrapper(req, res, next, async () => {
        await OneoffTransactionController.delete(req.session.user, req.params.id);
        res.status(200).json(ResponseBuilder({status: 'success'}));
    })
);

router.patch('/oneoff/:id',
    param('id').isInt({min: 0}).toInt(),
    body('date').isISO8601({ strict: true }).toDate().optional(),
    body('amount').isInt({ gt: 0 }).toInt().optional(),
    categoryShopIdResolveMiddleware,
    body('CategoryId').isInt().toInt().optional(),
    body('ShopId').isInt().toInt().optional({nullable: true}),
    (req, res, next) => asyncEndpointWrapper(req, res, next, async () => {
        const result = await OneoffTransactionController.update(req.session.user, req.params.id, req.body);
        res.status(201).json(ResponseBuilder({status: 'success', data: result}));
    })
)

router.get('/monthly',
    query('isExpense')  .isBoolean().toBoolean().optional(),
    query('monthFrom')   .matches(/\d{4}-\d{1,2}/).custom((monthFrom, { req }) => checkDateLowerThan(monthFrom, req.query.monthTo)).toDate().optional(),
    query('monthTo')     .matches(/\d{4}-\d{1,2}/).toDate().optional(),
    query('amountFrom')  .isInt().toInt().custom((amountFrom, { req }) => checkNumberLowerThan(amountFrom, req.query.amountTo)).optional(),
    query('amountTo')    .isInt().toInt().optional(),
    query('CategoryId')  .isInt().toInt().optional(),
    query('ShopId')      .isInt().toInt().optional(),
    query('limit')       .isInt().toInt().optional(),
    query('offset')      .isInt().toInt().optional(),
    (req, res, next) => asyncEndpointWrapper(req, res, next, async () => {
        const data = await MonthlyTransactionController.fetch(req.session.user, req.query);
        res.json(ResponseBuilder({status: 'success', data: data}));
    })
);

router.get('/monthly/:id',
    param('id').isInt({min: 0}).toInt(),
    (req, res, next) => asyncEndpointWrapper(req, res, next, async () => {
        const instance = await MonthlyTransactionController.getByUserAndId(req.session.user, req.params.id);
        res.json(ResponseBuilder({status: 'success', data: instance}));
    })
);

router.post('/monthly',
    body('isExpense')   .isBoolean().toBoolean(),
    body('monthFrom')   .matches(/\d{4}-\d{1,2}/).custom((monthFrom, { req }) => checkDateLowerThan(monthFrom, req.body.monthTo)),
    body('monthTo')     .matches(/\d{4}-\d{1,2}/).optional(),
    body('amount')      .isInt({ gt: 0 }).toInt(),
    categoryShopIdResolveMiddleware,
    body('CategoryId')  .isInt().toInt(),
    body('ShopId')      .isInt().toInt().optional({nullable: true}),
    (req, res, next) => asyncEndpointWrapper(req, res, next, async () => {
        const result = await MonthlyTransactionController.create(req.session.user, req.body);
        res.status(201).json(ResponseBuilder({status: 'success', data: result}));
    })
);

router.delete('/monthly/:id',
    param('id').isInt({min: 0}).toInt(),
    (req, res, next) => asyncEndpointWrapper(req, res, next, async () => {
        await MonthlyTransactionController.delete(req.session.user, req.params.id);
        res.status(204).json(ResponseBuilder({status: 'success'}));
    })
);

router.patch('/monthly/:id',
    param('id').isInt({min: 0}).toInt(),
    body('monthFrom')   .matches(/\d{4}-\d{1,2}/).custom((monthFrom, { req }) => checkDateLowerThan(monthFrom, req.body.monthTo)).optional(),
    body('monthTo')     .matches(/\d{4}-\d{1,2}/).optional({nullable: true, checkFalsy: true}),
    body('amount').isInt({ gt: 0 }).toInt().optional(),
    categoryShopIdResolveMiddleware,
    body('CategoryId').isInt().toInt().optional(),
    body('ShopId').isInt().toInt().optional({nullable: true}),
    (req, res, next) => asyncEndpointWrapper(req, res, next, async () => {
        const result = await MonthlyTransactionController.update(req.session.user, req.params.id, req.body);
        res.status(201).json(ResponseBuilder({status: 'success', data: result}));
    })
)

export default router;
