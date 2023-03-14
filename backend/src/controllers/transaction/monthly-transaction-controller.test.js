import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import createError from 'http-errors';

import config from '../../config.js';
import { Category, MonthlyTransaction, Shop, Transaction, User } from '../../database/db.js';
import { categoryShopIdResolver } from '../category-shop/AuxDataController.js';
import monthlyTransactionController from './monthly-transaction-controller.js';

chai.use(chaiAsPromised);
describe('MonthlyTransactionController', function () {
    describe('#create', function () {
        it('should successfully add a new monthly transaction to the database and return its instance', async function () {
            const user = await User.findOne();
            const transactionAttributes = {
                isExpense: true,
                monthFrom: new Date('2022-01'),
                monthTo: '2022-12',
                description: 'test-transaction',
                amount: 1,
                category: 'test-category',
                shop: 'test-shop'
            };
            const instance = await monthlyTransactionController.create(
                user,
                await categoryShopIdResolver(user, transactionAttributes)
            );
            const instanceTransaction = await instance.getTransaction();
            const instanceCategory = await instanceTransaction.getCategory();
            const instanceShop = await instanceTransaction.getShop();
            expect(new Date(transactionAttributes.monthFrom)).to.deep.equal(new Date(instance.monthFrom));
            expect(new Date(transactionAttributes.monthTo)).to.deep.equal(new Date(instance.monthTo));
            expect(transactionAttributes.isExpense).to.equal(instanceTransaction.isExpense);
            expect(transactionAttributes.description).to.equal(instanceTransaction.description);
            expect(transactionAttributes.amount).to.equal(instanceTransaction.amount);
            expect(transactionAttributes.category).to.equal(instanceCategory.name);
            expect(transactionAttributes.shop).to.equal(instanceShop.name);
            expect(await instance.getUser()).to.deep.equal(user);
        });
        it("should successfully add a new monthly transaction with monthTo being 'null'", async function () {
            const user = await User.findOne();
            const transactionAttributes = {
                isExpense: true,
                monthFrom: new Date('2022-01'),
                monthTo: null,
                description: 'test-transaction',
                amount: 1,
                category: 'test-category',
                shop: 'test-shop'
            };
            const instance = await monthlyTransactionController.create(
                user,
                await categoryShopIdResolver(user, transactionAttributes)
            );
            const instanceTransaction = await instance.getTransaction();
            const instanceCategory = await instanceTransaction.getCategory();
            const instanceShop = await instanceTransaction.getShop();
            expect(new Date(transactionAttributes.monthFrom)).to.deep.equal(new Date(instance.monthFrom));
            expect(instance.monthTo).to.be.null;
            expect(transactionAttributes.isExpense).to.equal(instanceTransaction.isExpense);
            expect(transactionAttributes.description).to.equal(instanceTransaction.description);
            expect(transactionAttributes.amount).to.equal(instanceTransaction.amount);
            expect(transactionAttributes.category).to.equal(instanceCategory.name);
            expect(transactionAttributes.shop).to.equal(instanceShop.name);
        });
        it("should fail to add a new monthly transaction with monthFrom being 'null'", async function () {
            const transactionAttributes = {
                isExpense: true,
                monthFrom: null,
                monthTo: null,
                description: 'test-transaction',
                amount: 1,
                category: 'test-category',
                shop: 'test-shop'
            };
            await expect(monthlyTransactionController.create(await User.findOne(), transactionAttributes)).to.be
                .rejected;
        });
        it('should also return associated transactions, categories and shops for the created instance', async () => {
            const user = await User.findOne();
            const instance = await monthlyTransactionController.create(
                user,
                await categoryShopIdResolver(user, {
                    isExpense: true,
                    monthFrom: '2022-01',
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
                await monthlyTransactionController.create(
                    user,
                    await categoryShopIdResolver(user, {
                        isExpense: true,
                        category: 'test-category',
                        amount: 1,
                        monthFrom: '2023-01'
                    })
                );
            }
        }
        it('should return all instances if no parameters are provided', async function () {
            const query = await monthlyTransactionController.fetch(await User.findOne());
            expect(query).to.be.lengthOf(5);
        });
        it('should return all instances if an empty object is provided', async function () {
            const query = await monthlyTransactionController.fetch(await User.findOne(), {});
            expect(query).to.be.lengthOf(5);
        });
        it('should apply isExpense attribute correctly', async function () {
            const user = await User.findOne();
            const query = await monthlyTransactionController.fetch(user, { isExpense: true });
            expect(query).to.be.lengthOf(3);
            const query2 = await monthlyTransactionController.fetch(user, { isExpense: false });
            expect(query2).to.be.lengthOf(2);
        });
        describe('{ monthFrom }', function () {
            it('should apply monthFrom (string) attribute correctly', async function () {
                const query = await monthlyTransactionController.fetch(await User.findOne(), { monthFrom: '2022-01' });
                expect(query).to.have.lengthOf(2);
                query.forEach((t) => {
                    expect(new Date(t.monthFrom)).to.be.at.least(new Date('2022-01'));
                });
            });
            it('should apply monthFrom (date) attribute correctly', async function () {
                const query = await monthlyTransactionController.fetch(await User.findOne(), {
                    monthFrom: new Date('2022-01')
                });
                expect(query).to.have.lengthOf(2);
                query.forEach((t) => {
                    expect(new Date(t.monthFrom)).to.be.at.least(new Date('2022-01'));
                });
            });
        });
        describe('{ monthTo }', function () {
            it('should apply monthTo (string) attribute correctly, get only mly transactions with monthTo higher or equal', async function () {
                const query = await monthlyTransactionController.fetch(await User.findOne(), { monthTo: '2018-05' });
                expect(query).to.have.lengthOf(1);
                query.forEach((t) => {
                    expect(new Date(t.monthTo)).to.be.at.least(new Date('2018-05'));
                });
            });
            it('should apply monthTo (date) attribute correctly, get only mly transactions with monthTo higher or equal', async function () {
                const query = await monthlyTransactionController.fetch(await User.findOne(), {
                    monthTo: new Date('2018-05')
                });
                expect(query).to.have.lengthOf(1);
                query.forEach((t) => {
                    expect(new Date(t.monthTo)).to.be.at.least(new Date('2018-05'));
                });
            });
            it('should apply monthTo (string) attribute correctly, get only mly transactions with monthTo being null', async function () {
                const query = await monthlyTransactionController.fetch(await User.findOne(), { monthTo: '2050-12' });
                expect(query).to.have.lengthOf(2);
                query.forEach((t) => {
                    expect(t.monthTo).to.be.null;
                });
            });
            it('should apply monthTo (date) attribute correctly, get only mly transactions with monthTo being null', async function () {
                const query = await monthlyTransactionController.fetch(await User.findOne(), {
                    monthTo: new Date('2050-12')
                });
                expect(query).to.have.lengthOf(2);
                query.forEach((t) => {
                    expect(t.monthTo).to.be.null;
                });
            });
            it('should apply monthTo == null attribute correctly, get only mly transactions with monthTo being null', async function () {
                const query = await monthlyTransactionController.fetch(await User.findOne(), { monthTo: null });
                expect(query).to.have.lengthOf(2);
                query.forEach((t) => {
                    expect(t.monthTo).to.be.null;
                });
            });
            it('should return nothing if monthFrom > monthTo (using strings)', async function () {
                const query = await monthlyTransactionController.fetch(await User.findOne(), {
                    monthFrom: '2020-01',
                    monthTo: '2019-12'
                });
                expect(query).to.be.empty;
            });
            it('should return nothing if monthFrom > monthTo (using dates)', async function () {
                const query = await monthlyTransactionController.fetch(await User.findOne(), {
                    monthFrom: new Date('2020-01'),
                    monthTo: new Date('2019-12')
                });
                expect(query).to.be.empty;
            });
        });
        it('should apply amountFrom attribute correctly', async function () {
            const testData = await monthlyTransactionController.fetch(await User.findOne(), { amountFrom: 1501 });
            expect(testData).to.have.lengthOf(3);
            testData.forEach((oneoffTransaction) => {
                expect(oneoffTransaction.Transaction.amount).to.be.at.least(1501);
            });
        });
        it('should apply amountTo attribute correctly', async function () {
            const query = await monthlyTransactionController.fetch(await User.findOne(), { amountTo: 100000 });
            expect(query).to.have.lengthOf(3);
            query.forEach((oneoffTransaction) => {
                expect(oneoffTransaction.Transaction.amount).to.be.at.most(100000);
            });
        });
        it('should return nothing if amountFrom > amountTo', async function () {
            const query = await monthlyTransactionController.fetch(await User.findOne(), {
                amountFrom: 10000,
                amountTo: 1
            });
            expect(query).to.be.empty;
        });
        it('should apply category attribute correctly', async function () {
            const user = await User.findOne();
            const category = await Category.findOne({ where: { userId: user.id, name: 'income' } });
            const query = await monthlyTransactionController.fetch(user, { CategoryId: category.id });
            expect(query).to.have.lengthOf(2);
            query.forEach((oneoffTransaction) => {
                expect(oneoffTransaction.Transaction.Category.name).to.be.equal('income');
            });
        });
        it('should apply shop attribute correctly', async function () {
            const user = await User.findOne();
            const shop = await Shop.findOne({
                where: {
                    userId: user.id,
                    name: 'music streaming'
                }
            });
            const query = await monthlyTransactionController.fetch(user, { ShopId: shop.id });
            expect(query).to.have.lengthOf(1);
            query.forEach((oneoffTransaction) => {
                expect(oneoffTransaction.Transaction.Shop.name).to.be.equal('music streaming');
            });
        });
        it('should apply limit attribute correctly', async function () {
            const query = await monthlyTransactionController.fetch(await User.findOne(), { limit: 3 });
            expect(query).to.have.lengthOf(3);
        });
        it('should apply offset attribute correctly', async function () {
            // skip first 3 rows, return the remaining two
            const query = await monthlyTransactionController.fetch(await User.findOne(), { offset: 3 });
            expect(query).to.have.lengthOf(2);
        });
        it('should order the transactions by monthFrom ASC, then by monthTo ASC with nulls last and finally by the auto incremented id', async function () {
            const user = await User.findOne();
            const test_data = await categoryShopIdResolver(user, {
                isExpense: true,
                monthFrom: new Date('2018-06'),
                description: 'test-transaction',
                amount: '1',
                category: 'test-category',
                shop: 'test-shop'
            });
            const instance = await monthlyTransactionController.create(user, test_data);
            const instance2 = await monthlyTransactionController.create(user, test_data);
            const query = await monthlyTransactionController.fetch(user);
            expect(query).to.be.of.length(7);
            expect(JSON.stringify(query[2])).to.equal(JSON.stringify(instance));
            expect(JSON.stringify(query[3])).to.equal(JSON.stringify(instance2));
        });
        it('should also fetch associated transactions, categories and shops', async () => {
            const query = await monthlyTransactionController.fetch(await User.findOne());
            expect(query[0].Transaction.id).to.exist;
            expect(query[0].Transaction.Shop.id).to.exist;
            expect(query[0].Transaction.Category.id).to.exist;
        });
        it('should only fetch transactions of the provided user', async () => {
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            expect(await monthlyTransactionController.fetch(newUser)).to.be.of.length(0);
            await monthlyTransactionController.create(
                newUser,
                await categoryShopIdResolver(newUser, {
                    monthFrom: '2023-01',
                    isExpense: true,
                    amount: 1,
                    category: 'test'
                })
            );
            expect(await monthlyTransactionController.fetch(newUser)).to.be.of.length(1);
        });
        it('should use the `payload_limit from the config`', async () => {
            const user = await User.findOne();
            const oldMaxLimit = config.api.query.payload_limit;
            try {
                config.api.query.payload_limit = 3;
                await nSampleTransactions(user, 5);
                const query = await monthlyTransactionController.fetch(user);
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
                const query = await monthlyTransactionController.fetch(user, {
                    limit: 100
                });
                expect(query).to.be.lengthOf(3);
            } finally {
                config.api.query.payload_limit = oldMaxLimit;
            }
        });
    });
    describe('#getByUserAndId', () => {
        it('should get one-off transactions by id', async () => {
            const user = await User.findOne();
            const firstInstance = await MonthlyTransaction.findOne({ where: { UserId: user.id } });
            const instance = await monthlyTransactionController.getByUserAndId(user, firstInstance.id);
            expect(instance.id).to.equal(firstInstance.id);
        });
        it('should also fetch associated transactions, categories and shops', async () => {
            const user = await User.findOne();
            const firstInstance = await MonthlyTransaction.findOne({ where: { UserID: user.id } });
            const instance = await monthlyTransactionController.getByUserAndId(user, firstInstance.id);
            expect(instance.Transaction.id).to.exist;
            expect(instance.Transaction.Shop.id).to.exist;
            expect(instance.Transaction.Category.id).to.exist;
        });
        it('should throw a 404 error if the transactions does not belong to the provided user', async () => {
            const oldUser = await User.findOne();
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await MonthlyTransaction.findOne({ where: { UserID: oldUser.id } });
            expect(monthlyTransactionController.getByUserAndId(newUser, instance.id)).to.be.rejectedWith(/Not Found/);
        });
    });
    describe('#delete', () => {
        it('should delete one-off transactions by id', async () => {
            const user = await User.findOne();
            const countBefore = await MonthlyTransaction.count({ where: { UserId: user.id } });
            const instance = await MonthlyTransaction.findOne({ where: { UserId: user.id } });
            await monthlyTransactionController.delete(user, instance.id);
            expect(await MonthlyTransaction.count({ where: { UserId: user.id } })).to.be.equal(countBefore - 1);
        });
        it('should also delete the associated base transaction', async () => {
            const user = await User.findOne();
            const instance = await MonthlyTransaction.findOne({ where: { UserId: user.id } });
            const monthlyTransactionId = instance.id;
            const transactionId = instance.Transaction.id;
            await monthlyTransactionController.delete(user, instance.id);
            expect(await MonthlyTransaction.findByPk(monthlyTransactionId)).to.be.null;
            expect(await Transaction.findByPk(transactionId)).to.be.null;
        });
        it('should return an 404 http error if the primary key is invalid', async () => {
            await expect(monthlyTransactionController.delete(await User.findOne(), -1)).to.be.rejectedWith(
                createError[404]
            );
        });
        it('should return an 404 http error if the transaction belongs to another user', async () => {
            const oldUser = await User.findOne();
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await MonthlyTransaction.findOne({ where: { UserID: oldUser.id } });
            expect(monthlyTransactionController.delete(newUser, instance.id)).to.be.rejectedWith(createError.NotFound);
        });
    });
    describe('#update', () => {
        it('should return the same instance if no body is provided', async () => {
            const user = await User.findOne();
            const instance = await MonthlyTransaction.findOne({ where: { UserId: user.id } });
            const updatedInstance = await monthlyTransactionController.update(user, instance.id);
            expect(JSON.parse(JSON.stringify(instance))).to.be.deep.equal(JSON.parse(JSON.stringify(updatedInstance)));
        });
        it('should return the same instance if body is empty', async () => {
            const user = await User.findOne();
            const instance = await MonthlyTransaction.findOne({ where: { UserId: user.id } });
            const updatedInstance = await monthlyTransactionController.update(user, instance.id, {});
            expect(JSON.parse(JSON.stringify(instance))).to.be.deep.equal(JSON.parse(JSON.stringify(updatedInstance)));
        });
        it('should modify the body with the provided data', async () => {
            const user = await User.findOne();
            const instance = await MonthlyTransaction.findOne({ where: { UserId: user.id } });
            const updatedInstance = await monthlyTransactionController.update(
                user,
                instance.id,
                await categoryShopIdResolver(user, {
                    amount: 12345,
                    monthFrom: '2023-01',
                    monthTo: '2023-12',
                    category: 'update-test',
                    shop: 'update-test',
                    description: 'testing update method ...'
                })
            );
            expect(new Date(updatedInstance.monthFrom)).to.be.deep.equal(new Date('2023-01'));
            expect(new Date(updatedInstance.monthTo)).to.be.deep.equal(new Date('2023-12'));
            expect(updatedInstance.Transaction.amount).to.be.equal(12345);
            expect(updatedInstance.Transaction.description).to.be.equal('testing update method ...');
            expect(updatedInstance.Transaction.Category.name).to.be.equal('update-test');
            expect(updatedInstance.Transaction.Shop.name).to.be.equal('update-test');
            expect(updatedInstance.updatedAt).to.be.above(instance.updatedAt);
            // this property does not exist?
            //expect(new Date(updatedInstance.Transaction.updatedAt)).to.be.above(new Date(instance.Transaction.updatedAt));
        });
        it('should apply setting monthTo to null', async () => {
            const user = await User.findOne();
            const instance = await monthlyTransactionController.create(
                user,
                await categoryShopIdResolver(user, {
                    isExpense: true,
                    monthFrom: '2023-01',
                    monthTo: '2023-12',
                    amount: 1,
                    category: 'test'
                })
            );
            const updatedInstance = await monthlyTransactionController.update(user, instance.id, {
                monthTo: null
            });
            expect(updatedInstance.monthTo).to.be.null;
        });
        it('should apply setting ShopId to null', async () => {
            const user = await User.findOne();
            const instance = await monthlyTransactionController.create(
                user,
                await categoryShopIdResolver(user, {
                    isExpense: true,
                    monthFrom: '2023-01',
                    amount: 1,
                    category: 'test',
                    shop: 'test'
                })
            );
            const updatedInstance = await monthlyTransactionController.update(user, instance.id, {
                ShopId: null
            });
            expect(updatedInstance.Transaction.ShopId).to.be.null;
        });
        it('should return an 404 http error if the primary key is invalid', async () => {
            await expect(monthlyTransactionController.update(await User.findOne(), -1, {})).to.be.rejectedWith(
                createError[404]
            );
        });
        it('should return an 404 http error if the transaction belongs to another user', async () => {
            const oldUser = await User.findOne();
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await MonthlyTransaction.findOne({ where: { UserID: oldUser.id } });
            expect(monthlyTransactionController.update(newUser, instance.id, {})).to.be.rejectedWith(
                createError.NotFound
            );
        });
    });
});
