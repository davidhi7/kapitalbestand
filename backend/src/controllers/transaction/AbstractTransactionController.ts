import createError from 'http-errors';
import { ModelStatic } from 'sequelize';
import { Model } from 'sequelize-typescript';

import { Transaction, User } from '../../database/db.js';

interface GenericTransaction extends Model {
    Transaction: Transaction;
}

export type TransactionPayload = {
    isExpense?: boolean,
    amount?: number,
    description?: string,
    CategoryId?: number,
    ShopId?: number,
    category?: string,
    shop?: string
}

export type TransactionQueryPayload = {
    isExpense?: boolean,
    amountFrom?: number,
    amountTo?: number,
    description?: string,
    CategoryId?: number,
    ShopId?: number,
    category?: string,
    shop?: string,
    limit?: number,
    offset?: number
}

export default class AbstractTransactionController<Type extends GenericTransaction> {
    model: ModelStatic<any>;

    constructor(model: ModelStatic<any>) {
        this.model = model;
    }

    async delete(user: User, id: number): Promise<void> {
        const instance = await this.getByUserAndId(user, id);
        const transaction = instance.Transaction;
        await instance.destroy();
        await transaction.destroy();
    }

    async getByUserAndId(user: User, id: Number): Promise<Type> {
        const instance = await this.model.findOne({
            where: {
                id: id,
                UserId: user.id
            }
        });
        if (!instance) {
            throw createError[404]();
        }
        return instance;
    }
}
