import createError from 'http-errors';
import { Order } from 'sequelize';
import sequelize from 'sequelize';
import { Model } from 'sequelize-typescript';

import { OneoffTransaction, Transaction, User } from '../../database/db.js';
import { BaseFetchParameters } from '../types.js';
import AbstractTransactionController, {
    TransactionCreateParameters,
    TransactionQueryParameters
} from './AbstractTransactionController.js';
import { buildWhereConditions } from './transaction-utils.js';

export interface OneoffTransactionCreateParameters extends TransactionCreateParameters {
    date: Date;
}

export interface OneoffTransactionQueryParameters
    extends TransactionQueryParameters,
        BaseFetchParameters {
    dateFrom?: Date;
    dateTo?: Date;
}

class OneoffTransactionController extends AbstractTransactionController<OneoffTransaction> {
    constructor() {
        super(OneoffTransaction);
    }

    async create(user: User, body: OneoffTransactionCreateParameters) {
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

    async fetch(user: User, limit: number, offset: number, body: OneoffTransactionQueryParameters) {
        let whereConditions = {};
        const { isExpense, dateFrom, dateTo, amountFrom, amountTo, CategoryId, ShopId } = body;
        whereConditions = buildWhereConditions(user, {
            dateLimit: [dateFrom, dateTo],
            amountLimit: [amountFrom, amountTo],
            CategoryId: CategoryId,
            ShopId: ShopId,
            isExpense: isExpense
        });

        const orderRules: Order = [];
        const order = body.order ?? 'ASC';
        const orderKey = body.orderKey ?? 'time';
        switch (orderKey) {
            case 'time':
                orderRules.push(['date', order]);
                break;
            case 'amount':
                orderRules.push([Transaction, 'amount', order]);
                break;
            case 'Category':
                orderRules.push([
                    sequelize.fn('lower', sequelize.col('Transaction.Category.name')),
                    order
                ]);
                break;
            case 'Shop':
                orderRules.push([
                    sequelize.fn('lower', sequelize.col('Transaction.Shop.name')),
                    order
                ]);
                break;
        }
        orderRules.push(['id', order]);

        return OneoffTransaction.findAll({
            where: whereConditions,
            order: orderRules,
            limit: limit,
            offset: offset
        });
    }

    async update(user: User, id: number, body: Partial<OneoffTransactionCreateParameters>) {
        let instance = await this.getByUserAndId(user, id);

        function setIfNotUndefined(
            key: keyof OneoffTransactionCreateParameters,
            modelInstance: Model = instance
        ) {
            if (body[key] !== undefined) {
                modelInstance.set(key, body[key]);
            }
        }

        if (!instance) {
            throw createError.NotFound();
        }
        if (body != null && Object.keys(body).length != 0) {
            setIfNotUndefined('date');
            setIfNotUndefined('amount', instance.Transaction);
            setIfNotUndefined('CategoryId', instance.Transaction);
            setIfNotUndefined('ShopId', instance.Transaction);
            setIfNotUndefined('description', instance.Transaction);
            setIfNotUndefined('isExpense', instance.Transaction);
            instance.changed('updatedAt', true);
            instance.Transaction.changed('updatedAt', true);
            await instance.save();
            await instance.Transaction.save();
            instance = await this.getByUserAndId(user, instance.id);
        }
        // save does not load corresponding category and shop names, so we will have to query the just created instance to actually load these associated instances.
        return instance;
    }
}

export default new OneoffTransactionController();
