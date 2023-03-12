import createError from 'http-errors';

import config from '../../config.js';
import { MonthlyTransaction, Transaction } from '../../database/db.js';
import AbstractTransactionController from './AbstractTransactionController.js';
import { buildWhereConditions } from './transaction-utils.js';

class MonthlyTransactionController extends AbstractTransactionController {
    constructor() {
        super(MonthlyTransaction);
    }

    async create(user, body) {
        const { isExpense, monthFrom, monthTo, amount, CategoryId, ShopId, description } = body;
        const instance = await MonthlyTransaction.create(
            {
                UserId: user.id,
                // TODO what was I thinking?
                // even though monthFrom should be a valid 'YYYY-MM' value, in case it is not this still leads to an SQL Error
                monthFrom: monthFrom ? new Date(monthFrom) : null,
                monthTo: monthTo ? new Date(monthTo) : null,
                Transaction: {
                    isExpense: isExpense,
                    amount: amount,
                    CategoryId: CategoryId,
                    ShopId: ShopId,
                    description: description
                }
            },
            {
                // even though the default scope includes Transaction instances, they need to be specified manually for creating
                include: [Transaction]
            }
        );
        // create does not load corresponding category and shop names, so we will have to query the just created instance to actually load these associated instances.
        // TODO test with new scopes
        return this.getByUserAndId(user, instance.id);
    }

    async fetch(user, body) {
        let whereConditions = {};
        let queryLimit = config.api.query.payload_limit;
        let queryOffset = 0;
        if (body) {
            const { isExpense, monthFrom, monthTo, amountFrom, amountTo, CategoryId, ShopId, limit, offset } = body;
            whereConditions = buildWhereConditions(user, {
                monthLimit: [monthFrom, monthTo],
                amountLimit: [amountFrom, amountTo],
                CategoryId: CategoryId,
                ShopId: ShopId,
                isExpense: isExpense
            });

            if (limit) {
                queryLimit = Math.min(limit, config.api.query.payload_limit);
            }

            if (offset) {
                queryOffset = offset;
            }
        } else {
            whereConditions = buildWhereConditions(user);
        }

        return await MonthlyTransaction.findAll({
            where: whereConditions,
            order: [
                ['monthFrom', 'ASC'],
                ['monthTo', 'ASC NULLS LAST'],
                ['id', 'ASC']
            ],
            limit: queryLimit,
            offset: queryOffset
        });
    }

    async update(user, id, body) {
        let instance = await this.getByUserAndId(user, id);
        if (!instance) {
            throw createError.NotFound();
        }
        if (body != null) {
            for (let monthlyTransactionProperty of ['monthFrom', 'monthTo']) {
                if (body[monthlyTransactionProperty] !== undefined) {
                    // handle possible empty string value for monthTo with ternary operator
                    instance.set(monthlyTransactionProperty, body[monthlyTransactionProperty] || null);
                }
            }
            for (let transactionProperty of ['amount', 'CategoryId', 'ShopId', 'description']) {
                if (body[transactionProperty] !== undefined) {
                    instance.Transaction.set(transactionProperty, body[transactionProperty]);
                }
            }
            await instance.save();
            await instance.Transaction.save();
            instance = await this.getByUserAndId(user, instance.id);
        }
        // save does not load corresponding category and shop names, so we will have to query the just created instance to actually load these associated instances.
        return instance;
    }
}

export default new MonthlyTransactionController();
