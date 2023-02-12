import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import createError from 'http-errors';

import { Category, Shop, SingleTransaction as OneoffTransaction, User } from '../db.js';
import oneoffTransactionController from './one-off-transaction-controller.js';
import { categoryShopIdResolver } from '../category-shop/AuxDataController.js';
import config from '../../config.js';

chai.use(chaiAsPromised);
describe('OneoffTransactionController', function () {
    describe('#create', async function () {
        it('should successfully add a new one-off transaction to the database and return its instance', async function () {
            const user = await User.findOne();
            const transactionAttributes = {
                isExpense: true,
                date: new Date('2022-01-01'),
                description: 'test-transaction',
                amount: 1,
                category: 'test-category',
                shop: 'test-shop'
            };
            const instance = await oneoffTransactionController.create(
                user,
                await categoryShopIdResolver(user, transactionAttributes)
            );
            const instanceTransaction = await instance.getTransaction();
            const instanceCategory = await instanceTransaction.getCategory();
            const instanceShop = await instanceTransaction.getShop();
            expect(transactionAttributes.date).to.deep.equal(new Date(instance.date));
            expect(transactionAttributes.isExpense).to.equal(instanceTransaction.isExpense);
            expect(transactionAttributes.description).to.equal(instanceTransaction.description);
            expect(transactionAttributes.amount).to.equal(instanceTransaction.amount);
            expect(transactionAttributes.category).to.equal(instanceCategory.name);
            expect(transactionAttributes.shop).to.equal(instanceShop.name);
            expect(await instance.getUser()).to.deep.equal(user);
        });
        it('should also return associated transactions, categories and shops for the created instance', async () => {
            const user = await User.findOne();
            const instance = await oneoffTransactionController.create(
                user,
                await categoryShopIdResolver(user, {
                    isExpense: true,
                    date: '2022-01-01',
                    amount: 1,
                    category: 'test',
                    shop: 'shop'
                })
            );
            expect(instance.Transaction.id).to.exist;
            expect(instance.Transaction.Shop.id).to.exist;
            expect(instance.Transaction.Category.id).to.exist;
        });
    });
    describe('#fetch', function () {
        async function nSampleTransactions(user, n) {
            for (let i = 0; i < n; i++) {
                await oneoffTransactionController.create(
                    user,
                    await categoryShopIdResolver(user, {
                        isExpense: true,
                        category: 'test-category',
                        amount: 1,
                        date: '2023-01-01'
                    })
                );
            }
        }
        it('should return all instances if no parameters are provided', async function () {
            const query = await oneoffTransactionController.fetch(await User.findOne());
            expect(query).to.be.lengthOf(8);
        });
        it('should return all instances if an empty object is provided', async function () {
            const query = await oneoffTransactionController.fetch(await User.findOne(), {});
            expect(query).to.be.lengthOf(8);
        });
        it('should apply isExpense attribute correctly', async function () {
            const query = await oneoffTransactionController.fetch(await User.findOne(), { isExpense: true });
            expect(query).to.be.lengthOf(6);
            const query2 = await oneoffTransactionController.fetch(await User.findOne(), { isExpense: false });
            expect(query2).to.be.lengthOf(2);
        });
        describe('{ dateFrom }', function () {
            it('should apply dateFrom (string) attributes correctly', async function () {
                const testData = await oneoffTransactionController.fetch(await User.findOne(), {
                    dateFrom: '2020-01-01'
                });
                expect(testData).to.have.lengthOf(5);
                testData.forEach((oneoffTransaction) => {
                    expect(new Date(oneoffTransaction.date)).to.be.at.least(new Date('2020-01-01'));
                });
            });
            it('should apply dateFrom (date) attributes correctly', async function () {
                const testData = await oneoffTransactionController.fetch(await User.findOne(), {
                    dateFrom: new Date('2020-01-01')
                });
                expect(testData).to.have.lengthOf(5);
                testData.forEach((oneoffTransaction) => {
                    expect(new Date(oneoffTransaction.date)).to.be.at.least(new Date('2020-01-01'));
                });
            });
        });
        describe('{ dateTo }', function () {
            it('should apply dateTo (string) attributes correctly', async function () {
                const testData = await oneoffTransactionController.fetch(await User.findOne(), {
                    dateTo: '2020-01-01'
                });
                expect(testData).to.have.lengthOf(3);
                testData.forEach((oneoffTransaction) => {
                    expect(new Date(oneoffTransaction.date)).to.be.at.most(new Date('2020-01-01'));
                });
            });
            it('should apply dateTo (date) attributes correctly', async function () {
                const testData = await oneoffTransactionController.fetch(await User.findOne(), {
                    dateTo: new Date('2020-01-01')
                });
                expect(testData).to.have.lengthOf(3);
                testData.forEach((oneoffTransaction) => {
                    expect(new Date(oneoffTransaction.date)).to.be.at.most(new Date('2020-01-01'));
                });
            });
            it('should return nothing if dateFrom > dateTo (using strings)', async function () {
                const query = await oneoffTransactionController.fetch(await User.findOne(), {
                    dateFrom: '2022-01-01',
                    dateTo: '2000-01-01'
                });
                expect(query).to.be.empty;
            });
            it('should return nothing if dateFrom > dateTo (using dates)', async function () {
                const query = await oneoffTransactionController.fetch(await User.findOne(), {
                    dateFrom: new Date('2022-01-01'),
                    dateTo: new Date('2000-01-01')
                });
                expect(query).to.be.empty;
            });
        });
        it('should apply amountFrom attribute correctly', async function () {
            const testData = await oneoffTransactionController.fetch(await User.findOne(), { amountFrom: 10000 });
            expect(testData).to.have.lengthOf(5);
            testData.forEach((oneoffTransaction) => {
                expect(oneoffTransaction.Transaction.amount).to.be.at.least(10000);
            });
        });
        it('should apply amountTo attribute correctly', async function () {
            const testData = await oneoffTransactionController.fetch(await User.findOne(), { amountTo: 10000 });
            expect(testData).to.have.lengthOf(4);
            testData.forEach((oneoffTransaction) => {
                expect(oneoffTransaction.Transaction.amount).to.be.at.most(10000);
            });
        });
        it('should return nothing if amountFrom > amountTo', async function () {
            const query = await oneoffTransactionController.fetch(await User.findOne(), {
                amountFrom: 10000,
                amountTo: 1
            });
            expect(query).to.be.empty;
        });
        it('should apply category attribute correctly', async function () {
            const user = await User.findOne();
            const category = await Category.findOne({ where: { UserId: user.id, name: 'property' } });
            const testData = await oneoffTransactionController.fetch(user, { CategoryId: category.id });
            expect(testData).to.have.lengthOf(1);
            testData.forEach((oneoffTransaction) => {
                expect(oneoffTransaction.Transaction.Category.name).to.be.equal('property');
            });
        });
        it('should apply shop attribute correctly', async function () {
            const user = await User.findOne();
            const shop = await Shop.findOne({ where: { UserId: user.id, name: 'hardware store' } });
            const testData = await oneoffTransactionController.fetch(user, { ShopId: shop.id });
            expect(testData).to.have.lengthOf(1);
            testData.forEach((oneoffTransaction) => {
                expect(oneoffTransaction.Transaction.Shop.name).to.be.equal('hardware store');
            });
        });
        it('should apply limit attribute correctly', async function () {
            const testData = await oneoffTransactionController.fetch(await User.findOne(), { limit: 3 });
            expect(testData).to.have.lengthOf(3);
        });
        it('should apply offset attribute correctly', async function () {
            // skip first 6 rows, expect the remaining two
            const testData = await oneoffTransactionController.fetch(await User.findOne(), { offset: 6 });
            expect(testData).to.have.lengthOf(2);
        });
        it('should order the transactions by date ASC, then by id ASC', async function () {
            const user = await User.findOne();
            const test_data = await categoryShopIdResolver(user, {
                isExpense: true,
                date: new Date('2020-01-01'),
                description: 'test-transaction',
                amount: '1',
                category: 'test-category',
                shop: 'test-shop'
            });
            const instance = await oneoffTransactionController.create(user, test_data);
            const instance2 = await oneoffTransactionController.create(user, test_data);
            const query = await oneoffTransactionController.fetch(user, {});
            expect(query).to.be.of.length(10);
            expect(JSON.stringify(query[3])).to.equal(JSON.stringify(instance));
            expect(JSON.stringify(query[4])).to.equal(JSON.stringify(instance2));
        });
        it('should also fetch associated transactions, categories and shops', async () => {
            const query = await oneoffTransactionController.fetch(await User.findOne());
            expect(query[0].Transaction.id).to.exist;
            expect(query[0].Transaction.Shop.id).to.exist;
            expect(query[0].Transaction.Category.id).to.exist;
        });
        it('should only fetch transactions of the provided user', async () => {
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            expect(await oneoffTransactionController.fetch(newUser)).to.be.of.length(0);
            await oneoffTransactionController.create(
                newUser,
                await categoryShopIdResolver(newUser, {
                    date: '2023-01-01',
                    isExpense: true,
                    amount: 1,
                    category: 'test'
                })
            );
            expect(await oneoffTransactionController.fetch(newUser)).to.be.of.length(1);
        });
        it('should use the `payload_limit from the config`', async () => {
            const user = await User.findOne();
            const oldMaxLimit = config.api.query.payload_limit;
            try {
                config.api.query.payload_limit = 3;
                await nSampleTransactions(user, 5);
                const query = await oneoffTransactionController.fetch(user);
                expect(query).to.be.lengthOf(3);
            } finally {
                config.api.query.payload_limit = oldMaxLimit;
            }
        });
        it('should fall back to the upper limit threshold in the config if it is lower than the given limit', async () => {
            const user = await User.findOne();
            const oldMaxLimit = config.api.query.payload_limit;
            try {
                config.api.query.payload_limit = 3;
                await nSampleTransactions(user, 5);
                const query = await oneoffTransactionController.fetch(user, {
                    limit: 100
                });
                expect(query).to.be.lengthOf(3);
            } finally {
                config.api.query.payload_limit = oldMaxLimit;
            }
        });
    });
    describe('#getbyIdAndUser', () => {
        it('should get one-off transactions by id', async () => {
            const user = await User.findOne();
            const firstInstance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const instance = await oneoffTransactionController.getByUserAndId(user, firstInstance.id);
            expect(instance.id).to.equal(firstInstance.id);
        });
        it('should also fetch associated transactions, categories and shops', async () => {
            const user = await User.findOne();
            const firstInstance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const instance = await oneoffTransactionController.getByUserAndId(user, firstInstance.id);
            expect(instance.Transaction.id).to.exist;
            expect(instance.Transaction.Shop.id).to.exist;
            expect(instance.Transaction.Category.id).to.exist;
        });
        it('should return an 404 http error if the transaction belongs to another user', async () => {
            const oldUser = await User.findOne();
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await OneoffTransaction.findOne({ where: { UserID: oldUser.id } });
            expect(oneoffTransactionController.getByUserAndId(newUser, instance.id)).to.be.rejectedWith(/Not Found/);
        });
    });
    describe('#delete', () => {
        it('should delete one-off transactions by id', async () => {
            const user = await User.findOne();
            const countBefore = await OneoffTransaction.count({ where: { UserId: user.id } });
            const instance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            await oneoffTransactionController.delete(user, instance.id);
            expect(await OneoffTransaction.count({ where: { UserId: user.id } })).to.be.equal(countBefore - 1);
        });
        it('should return an 404 http error if the primary key is invalid', async () => {
            await expect(oneoffTransactionController.delete(await User.findOne(), -1)).to.be.rejectedWith(
                createError[404]
            );
        });
        it('should return an 404 http error if the transaction belongs to another user', async () => {
            const oldUser = await User.findOne();
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await OneoffTransaction.findOne({ where: { UserID: oldUser.id } });
            expect(oneoffTransactionController.delete(newUser, instance.id)).to.be.rejectedWith(createError.NotFound);
        });
    });
    describe('#update', () => {
        it('should return the same instance if no body is provided', async () => {
            const user = await User.findOne();
            const instance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const updatedInstance = await oneoffTransactionController.update(user, instance.id);
            expect(JSON.parse(JSON.stringify(instance))).to.be.deep.equal(JSON.parse(JSON.stringify(updatedInstance)));
        });
        it('should return the same instance if body is empty', async () => {
            const user = await User.findOne();
            const instance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const updatedInstance = await oneoffTransactionController.update(user, instance.id, {});
            expect(JSON.parse(JSON.stringify(instance))).to.be.deep.equal(JSON.parse(JSON.stringify(updatedInstance)));
        });
        it('should modify the body with the provided data', async () => {
            const user = await User.findOne();
            const instance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const updatedInstance = await oneoffTransactionController.update(
                user,
                instance.id,
                await categoryShopIdResolver(user, {
                    amount: 12345,
                    date: '2023-01-04',
                    category: 'update-test',
                    shop: 'update-test',
                    description: 'testing update method ...'
                })
            );
            expect(new Date(updatedInstance.date)).to.be.deep.equal(new Date('2023-01-04'));
            expect(updatedInstance.Transaction.amount).to.be.equal(12345);
            expect(updatedInstance.Transaction.description).to.be.equal('testing update method ...');
            expect(updatedInstance.Transaction.Category.name).to.be.equal('update-test');
            expect(updatedInstance.Transaction.Shop.name).to.be.equal('update-test');
            expect(updatedInstance.updatedAt).to.be.above(instance.updatedAt);
            // TODO this property does not exist?
            //expect(new Date(updatedInstance.Transaction.updatedAt)).to.be.above(new Date(instance.Transaction.updatedAt));
        });
        it('should apply setting ShopId to null', async () => {
            const user = await User.findOne();
            const instance = await oneoffTransactionController.create(
                user,
                await categoryShopIdResolver(user, {
                    isExpense: true,
                    date: '2023-01-01',
                    amount: 1,
                    category: 'test',
                    shop: 'test'
                })
            );
            const updatedInstance = await oneoffTransactionController.update(user, instance.id, {
                ShopId: null
            });
            expect(updatedInstance.Transaction.ShopId).to.be.null;
        });
        it('should return an 404 http error if the primary key is invalid', async () => {
            await expect(oneoffTransactionController.update(await User.findOne(), -1, {})).to.be.rejectedWith(
                createError[404]
            );
        });
        it('should return an 404 http error if the transaction belongs to another user', async () => {
            const oldUser = await User.findOne();
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await OneoffTransaction.findOne({ where: { UserID: oldUser.id } });
            expect(oneoffTransactionController.update(newUser, instance.id, {})).to.be.rejectedWith(
                createError.NotFound
            );
        });
    });
});
