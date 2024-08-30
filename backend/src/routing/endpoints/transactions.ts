import express from 'express';
import { body, query } from 'express-validator';

import CategoryShopController, {
    CategoryOrShop
} from '../../controllers/category-shop/CategoryShopController.js';
import MonthlyTransactionController, {
    MonthlyTransactionCreateParameters,
    MonthlyTransactionQueryParameters
} from '../../controllers/transaction/MonthlyTransactionController.js';
import OneoffTransactionController, {
    OneoffTransactionCreateParameters,
    OneoffTransactionQueryParameters
} from '../../controllers/transaction/OneoffTransactionController.js';
import { Category, Shop } from '../../database/db.js';
import { AuthenticatedRequest } from '../authenticatedSession.js';
import { EndpointBuilder } from './EndpointBuilder.js';

function dateValidator(value: string) {
    if (value.split('-').length !== 3) return false;
    return !isNaN(new Date(value).getTime());
}

function monthValidator(value: string) {
    if (value.split('-').length !== 2) return false;
    return !isNaN(new Date(value).getTime());
}

function getCategoryShopValidator(model: CategoryOrShop) {
    // Typing { req } with { req: express.Request } doesn't stop Typescript from complaining
    return async (value: number, { req }: { req: any }) =>
        (await CategoryShopController.getById(
            model,
            (req as AuthenticatedRequest).session.user,
            value
        )) != null;
}

const transactionCreateValidators = [
    body('isExpense').isBoolean().toBoolean(),
    body('amount').isInt({ gt: 0 }).toInt(),
    body('CategoryId').custom(getCategoryShopValidator(Category)),
    body('ShopId').custom(getCategoryShopValidator(Shop)).optional()
];

const transactionQueryValidators = [
    query('isExpense').isBoolean().toBoolean().optional(),
    query('amountFrom').isInt().toInt().optional(),
    query('amountTo').isInt().toInt().optional(),
    query('ShopId').isInt().toInt().optional(),
    query('CategoryId').isInt().toInt().optional(),
    query('orderKey').isString().isIn(['time', 'amount', 'Category', 'Shop']).optional(),
    query('order').isString().isIn(['ASC', 'DESC']).optional()
];

const transactionUpdateValidators = [
    body('isExpense').isBoolean().toBoolean().optional(),
    body('amount').isInt({ gt: 0 }).toInt().optional(),
    body('CategoryId').custom(getCategoryShopValidator(Category)).optional(),
    body('ShopId').custom(getCategoryShopValidator(Shop)).optional()
];

const oneoffTransactionRouter = new EndpointBuilder<
    OneoffTransactionCreateParameters,
    OneoffTransactionQueryParameters
>()
    .get(
        [
            ...transactionQueryValidators,
            query('dateFrom').custom(dateValidator).optional(),
            query('dateTo').custom(dateValidator).optional()
        ],
        OneoffTransactionController.fetch.bind(OneoffTransactionController)
    )
    .getId(OneoffTransactionController.getByUserAndId.bind(OneoffTransactionController))
    .post(
        [...transactionCreateValidators, body('date').custom(dateValidator)],
        OneoffTransactionController.create.bind(OneoffTransactionController)
    )
    .patch(
        [...transactionUpdateValidators, body('date').custom(dateValidator).optional()],
        OneoffTransactionController.update.bind(OneoffTransactionController)
    )
    .delete(OneoffTransactionController.delete.bind(OneoffTransactionController))
    .getRouter();

const monthlyTransactionRouter = new EndpointBuilder<
    MonthlyTransactionCreateParameters,
    MonthlyTransactionQueryParameters
>()
    .get(
        [
            ...transactionQueryValidators,
            query('monthFrom').custom(monthValidator).optional(),
            query('monthTo')
                .custom((monthTo: string) => {
                    return monthTo === 'null' || monthValidator(monthTo);
                })
                .customSanitizer((monthTo: string) => {
                    if (monthTo === 'null') return null;
                    return monthTo;
                })
                .optional()
        ],
        MonthlyTransactionController.fetch.bind(MonthlyTransactionController)
    )
    .getId(MonthlyTransactionController.getByUserAndId.bind(MonthlyTransactionController))
    .post(
        [
            ...transactionCreateValidators,
            body('monthFrom').custom(monthValidator),
            body('monthTo')
                .custom(monthValidator)
                .custom((monthTo, { req }) => {
                    return (
                        new Date(monthTo) >=
                        new Date((req.body as MonthlyTransactionCreateParameters).monthFrom)
                    );
                })
                .optional()
        ],
        MonthlyTransactionController.create.bind(MonthlyTransactionController)
    )
    .patch(
        [
            ...transactionUpdateValidators,
            body('monthFrom').custom(monthValidator).optional(),
            body('monthTo').custom(monthValidator).optional()
        ],
        MonthlyTransactionController.update.bind(MonthlyTransactionController)
    )
    .delete(MonthlyTransactionController.delete.bind(MonthlyTransactionController))
    .getRouter();

const router = express.Router();
router.use('/oneoff', oneoffTransactionRouter);
router.use('/monthly', monthlyTransactionRouter);
export default router;
