import createError from 'http-errors';
import { Model } from 'sequelize';

import { MonthlyTransaction, Transaction, User } from '../../database/db.js';
import { BaseFetchParameters } from '../types.js';
import AbstractTransactionController, {
    TransactionCreateParameters,
    TransactionQueryParameters
} from './AbstractTransactionController.js';
import { buildWhereConditions } from './transaction-utils.js';

export interface MonthlyTransactionCreateParameters extends TransactionCreateParameters {
    monthFrom: Date;
    monthTo?: Date;
}

export interface MonthlyTransactionQueryParameters
    extends TransactionQueryParameters,
        BaseFetchParameters {
    monthFrom?: Date;
    monthTo?: Date;
}

class MonthlyTransactionController extends AbstractTransactionController<MonthlyTransaction> {
    constructor() {
        super(MonthlyTransaction);
    }

    async create(
        user: User,
        body: MonthlyTransactionCreateParameters
    ): Promise<MonthlyTransaction> {
        const { monthFrom, monthTo, isExpense, amount, description, CategoryId, ShopId } = body;
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
        return this.getByUserAndId(user, instance.id);
    }

    async fetch(
        user: User,
        limit: number,
        offset: number,
        body: MonthlyTransactionQueryParameters
    ): Promise<MonthlyTransaction[]> {
        let whereConditions = {};
        const { isExpense, monthFrom, monthTo, amountFrom, amountTo, CategoryId, ShopId } = body;
        whereConditions = buildWhereConditions(user, {
            monthLimit: [monthFrom, monthTo],
            amountLimit: [amountFrom, amountTo],
            CategoryId: CategoryId,
            ShopId: ShopId,
            isExpense: isExpense
        });

        return MonthlyTransaction.findAll({
            where: whereConditions,
            order: [
                ['monthFrom', 'ASC'],
                ['monthTo', 'ASC NULLS LAST'],
                ['id', 'ASC']
            ],
            limit: limit,
            offset: offset
        });
    }

    async update(
        user: User,
        id: number,
        body: MonthlyTransactionCreateParameters
    ): Promise<MonthlyTransaction> {
        let instance = await this.getByUserAndId(user, id);

        function setIfNotUndefined(
            key: keyof MonthlyTransactionCreateParameters,
            modelInstance: Model = instance
        ) {
            if (body[key] !== undefined) {
                modelInstance.set(key, body[key]);
            }
        }

        if (!instance) {
            throw createError.NotFound();
        }
        if (body != null) {
            setIfNotUndefined('monthFrom');
            setIfNotUndefined('monthTo');
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

export default new MonthlyTransactionController();
