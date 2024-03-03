import express from 'express';
import { body, query } from 'express-validator';

import CategoryShopController, { CategoryOrShop } from '../../controllers/category-shop/CategoryShopController.js';
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

const monthPattern = /\d{4}-\d{1,2}/;

function getCategoryShopValidator(model: CategoryOrShop) {
    // Typing { req } with { req: express.Request } doesn't stop Typescript from complaining
    return async (value: number, { req }: { req: any }) =>
        (await CategoryShopController.getById(model, (req as AuthenticatedRequest).session.user, value)) != null;
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
    query('CategoryId').isInt().toInt().optional()
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
            query('dateFrom').isISO8601().toDate().optional(),
            query('dateTo').isISO8601().toDate().optional()
        ],
        OneoffTransactionController.fetch.bind(OneoffTransactionController)
    )
    .getId(OneoffTransactionController.getByUserAndId.bind(OneoffTransactionController))
    .post(
        [...transactionCreateValidators, body('date').isISO8601({ strict: true }).toDate()],
        OneoffTransactionController.create.bind(OneoffTransactionController)
    )
    .patch(
        [...transactionUpdateValidators, body('date').isISO8601({ strict: true }).toDate().optional()],
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
            query('monthFrom').matches(monthPattern).toDate().optional(),
            query('monthTo').matches(monthPattern).toDate().optional()
        ],
        MonthlyTransactionController.fetch.bind(MonthlyTransactionController)
    )
    .getId(MonthlyTransactionController.getByUserAndId.bind(MonthlyTransactionController))
    .post(
        [
            ...transactionCreateValidators,
            body('monthFrom').matches(monthPattern),
            body('monthTo').matches(monthPattern).optional(),
            body('monthTo').custom((monthTo, { req }) => {
                return new Date(monthTo) >= new Date((req.body as MonthlyTransactionCreateParameters).monthFrom);
            })
        ],
        MonthlyTransactionController.create.bind(MonthlyTransactionController)
    )
    .patch(
        [
            ...transactionUpdateValidators,
            body('monthFrom').matches(monthPattern).optional(),
            body('monthTo').matches(monthPattern).optional()
        ],
        MonthlyTransactionController.update.bind(MonthlyTransactionController)
    )
    .delete(MonthlyTransactionController.delete.bind(MonthlyTransactionController))
    .getRouter();

const router = express.Router();
router.use('/oneoff', oneoffTransactionRouter);
router.use('/monthly', monthlyTransactionRouter);
export default router;
