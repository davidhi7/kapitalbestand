import * as fs from 'node:fs';

import sinon from 'sinon';

import sequelize from '../src/controllers/db.js';
import oneOffTransactionController from '../src/controllers/transaction/one-off-transaction-controller.js';
import monthlyTransactionController from '../src/controllers/transaction/monthly-transaction-controller.js';
import { User } from '../src/controllers/db.js';
import { categoryShopIdResolver } from '../src/controllers/category-shop/AuxDataController.js';

const sampleData = JSON.parse(fs.readFileSync('test/sample-transactions.json'));
const oneoffSample = sampleData.oneoffTransactions;
const monthlySample = sampleData.monthlyTransactions;

export const mochaHooks = {
    async beforeEach() {
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
        sequelize.truncate({ restartIdentity: true });
        sinon.restore();
    }
};
