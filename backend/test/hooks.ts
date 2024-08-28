import { readFileSync } from 'fs';
import { ModelStatic } from 'sequelize';
import sinon from 'sinon';

import {
    Category,
    MonthlyTransaction,
    OneoffTransaction,
    Shop,
    Transaction,
    User,
    connectToDatabase
} from '../src/database/db.js';
import { prepareMigrations } from '../src/database/migrations.js';

const sequelize = await connectToDatabase();
await prepareMigrations(sequelize).up();

type OneoffTransactionParameters = {
    isExpense: boolean;
    amount: number;
    category: string;
    shop: string;
    description: string;
    date: string;
};

type MonthlyTransactionParameters = {
    isExpense: boolean;
    amount: number;
    category: string;
    shop: string;
    description: string;
    monthFrom: string;
    monthTo: string;
};

const sampleData = JSON.parse(readFileSync('test/sample-transactions.json', 'utf-8'));
const oneoffSample = sampleData.oneoffTransactions;
const monthlySample = sampleData.monthlyTransactions;

export const mochaHooks = {
    async beforeEach() {
        for (let model of [
            User,
            Category,
            Shop,
            Transaction,
            OneoffTransaction,
            MonthlyTransaction
        ] as ModelStatic<any>[]) {
            await model.truncate({ cascade: true, restartIdentity: true });
        }
        const defaultUser = await User.create({
            username: 'testuser',
            hash: 'pw_hash'
        });

        let oneoffTransaction: OneoffTransactionParameters;
        let monthlyTransaction: MonthlyTransactionParameters;
        for (oneoffTransaction of oneoffSample) {
            const [categoryInstance] = await Category.findOrCreate({
                where: { name: oneoffTransaction.category, UserId: defaultUser.id }
            });
            let shopInstance: Shop | null = null;
            if (oneoffTransaction.shop) {
                [shopInstance] = await Shop.findOrCreate({
                    where: { name: oneoffTransaction.shop, UserId: defaultUser.id }
                });
            }
            await OneoffTransaction.create(
                {
                    UserId: defaultUser.id,
                    date: new Date(oneoffTransaction.date),
                    Transaction: {
                        isExpense: oneoffTransaction.isExpense,
                        amount: oneoffTransaction.amount,
                        CategoryId: categoryInstance.id,
                        ShopId: shopInstance?.id,
                        description: oneoffTransaction.description
                    }
                },
                { include: [Transaction] }
            );
        }
        for (monthlyTransaction of monthlySample) {
            const [categoryInstance] = await Category.findOrCreate({
                where: { name: monthlyTransaction.category, UserId: defaultUser.id }
            });
            let shopInstance: Shop | null = null;
            if (monthlyTransaction.shop) {
                [shopInstance] = await Shop.findOrCreate({
                    where: { name: monthlyTransaction.shop, UserId: defaultUser.id }
                });
            }
            await MonthlyTransaction.create(
                {
                    UserId: defaultUser.id,
                    monthFrom: new Date(monthlyTransaction.monthFrom),
                    monthTo: monthlyTransaction.monthTo
                        ? new Date(monthlyTransaction.monthTo)
                        : null,
                    Transaction: {
                        isExpense: monthlyTransaction.isExpense,
                        amount: monthlyTransaction.amount,
                        CategoryId: categoryInstance.id,
                        ShopId: shopInstance?.id,
                        description: monthlyTransaction.description
                    }
                },
                { include: [Transaction] }
            );
        }
    },
    async afterEach() {
        sinon.restore();
    }
};
