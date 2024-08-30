import createError from 'http-errors';
import { ModelStatic } from 'sequelize';

import { MonthlyTransaction, OneoffTransaction, User } from '../../database/db.js';

type GenericTransaction = OneoffTransaction | MonthlyTransaction;

export type TransactionCreateParameters = {
    isExpense: boolean;
    amount: number;
    CategoryId: number;
    ShopId?: number;
    description?: string;
};

export type TransactionQueryParameters = Partial<{
    isExpense: boolean;
    amountFrom: number;
    amountTo: number;
    description: string;
    CategoryId: number;
    ShopId: number;
    orderKey: 'time' | 'amount' | 'Category' | 'Shop';
    order: 'ASC' | 'DESC';
}>;

export default class AbstractTransactionController<Type extends GenericTransaction> {
    model: ModelStatic<Type>;

    constructor(model: ModelStatic<Type>) {
        this.model = model;
    }

    async delete(user: User, id: number): Promise<void> {
        const instance = await this.getByUserAndId(user, id);
        const transaction = instance.Transaction;
        await instance.destroy();
        await transaction.destroy();
    }

    async getByUserAndId(user: User, id: number): Promise<Type> {
        const instance = await this.model.findOne({
            where: {
                id: id,
                UserId: user.id
            }
        });
        if (!instance) {
            throw createError[404]();
        }
        return instance as Type;
    }
}
