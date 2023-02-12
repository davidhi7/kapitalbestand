import createError from 'http-errors';

import config from '../../config.js';
import { SingleTransaction as OneoffTransaction, Transaction } from '../db.js';
import AbstractTransactionController from './AbstractTransactionController.js';
import { buildWhereConditions } from './transaction-utils.js';

class OneoffTransactionController extends AbstractTransactionController {
    constructor() {
        super(OneoffTransaction);
    }

    async create(user, body) {
        const { isExpense, date, amount, CategoryId, ShopId, description } = body;
        const instance = await OneoffTransaction.create(
            {
                UserId: user.id,
                date: date,
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
        return this.getByUserAndId(user, instance.id);
    }

    async fetch(user, body) {
        let whereConditions = {};
        let queryLimit = config.api.query.payload_limit;
        let queryOffset = 0;
        if (body) {
            const { isExpense, dateFrom, dateTo, amountFrom, amountTo, CategoryId, ShopId, limit, offset } = body;
            whereConditions = buildWhereConditions(user, {
                dateLimit: [dateFrom, dateTo],
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

        return await OneoffTransaction.findAll({
            where: whereConditions,
            order: [
                ['date', 'ASC'],
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
            if (body.date !== undefined) {
                instance.set('date', body.date);
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

export default new OneoffTransactionController();
