import createError from 'http-errors';
import { Model } from 'sequelize-typescript';

import { OneoffTransaction, Transaction, User } from '../../database/db.js';
import AbstractTransactionController, { TransactionPayload, TransactionQueryPayload } from './AbstractTransactionController.js';
import { buildWhereConditions } from './transaction-utils.js';

interface OneoffTransactionPayload extends TransactionPayload {
    date: Date;
}

interface OneoffTransactionQueryPayload extends TransactionQueryPayload {
    dateFrom?: Date;
    dateTo?: Date;
}

class OneoffTransactionController extends AbstractTransactionController<OneoffTransaction> {
    constructor() {
        super(OneoffTransaction);
    }

    async create(user: User, body: OneoffTransactionPayload) {
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
        return this.getByUserAndId(user, instance.id);
    }

    async fetch(user: User, body: OneoffTransactionQueryPayload) {
        let whereConditions = {};
        const { limit, offset } = body;
        if (body) {
            const { isExpense, dateFrom, dateTo, amountFrom, amountTo, CategoryId, ShopId } = body;
            whereConditions = buildWhereConditions(user, {
                dateLimit: [dateFrom, dateTo],
                amountLimit: [amountFrom, amountTo],
                CategoryId: CategoryId,
                ShopId: ShopId,
                isExpense: isExpense
            });

        } else {
            whereConditions = buildWhereConditions(user);
        }

        return OneoffTransaction.findAll({
            where: whereConditions,
            order: [
                ['date', 'ASC'],
                ['id', 'ASC']
            ],
            limit: limit,
            offset: offset
        });
    }

    async update(user: User, id: number, body: OneoffTransactionPayload) {
        let instance = await this.getByUserAndId(user, id);

        function setIfNotUndefined(key: keyof OneoffTransactionPayload, modelInstance: Model = instance) {
            if (body[key] !== undefined) {
                modelInstance.set(key, body[key]);
            }
        }
        
        if (!instance) {
            throw createError.NotFound();
        }
        if (body != null) {
            setIfNotUndefined('date');
            setIfNotUndefined('amount', instance.Transaction);
            setIfNotUndefined('CategoryId', instance.Transaction);
            setIfNotUndefined('ShopId', instance.Transaction);
            setIfNotUndefined('description', instance.Transaction);
            await instance.save();
            await instance.Transaction.save();
            instance = await this.getByUserAndId(user, instance.id);
        }
        // save does not load corresponding category and shop names, so we will have to query the just created instance to actually load these associated instances.
        return instance;
    }
}

export default new OneoffTransactionController();
