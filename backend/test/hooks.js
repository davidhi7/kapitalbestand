import * as fs from 'node:fs';

import sinon from 'sinon';

import sequelize, { User } from '../src/database/db.js';
import oneOffTransactionController from '../src/controllers/transaction/OneoffTransactionController.js';
import monthlyTransactionController from '../src/controllers/transaction/MonthlyTransactionController.js';
import { categoryShopIdResolver } from '../src/controllers/category-shop/AuxDataController.js';

const sampleData = JSON.parse(fs.readFileSync('test/sample-transactions.json'));
const oneoffSample = sampleData.oneoffTransactions;
const monthlySample = sampleData.monthlyTransactions;

export const mochaHooks = {
    async beforeEach() {
        await sequelize.truncate({ restartIdentity: true, cascade: true });
        const defaultUser = await User.create({
            username: 'testuser',
            hash: 'pw_hash'
        });

        for (const transaction of oneoffSample) {
            await oneOffTransactionController.create(defaultUser, await categoryShopIdResolver(defaultUser, transaction));
        }
        for (const transaction of monthlySample) {
            await monthlyTransactionController.create(defaultUser, await categoryShopIdResolver(defaultUser, transaction));
        }
    },
    async afterEach() {
        sinon.restore();
    }
};
