import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import createError from 'http-errors';

import { Category, OneoffTransaction, Shop, Transaction, User } from '../../database/db.js';
import oneoffTransactionController from './OneoffTransactionController.js';

chai.use(chaiAsPromised);
describe('OneoffTransactionController', function () {
    describe('#create', function () {
        it('should successfully add a new one-off transaction to the database and return its instance', async function () {
            const user = await User.findOne();
            const category = await Category.findOne();
            const shop = await Shop.findOne();
            const transactionAttributes = {
                isExpense: true,
                date: new Date('2022-01-01'),
                description: 'test-transaction',
                amount: 1,
                CategoryId: category.id,
                ShopId: shop.id
            };
            const instance = await oneoffTransactionController.create(user, transactionAttributes);
            const instanceTransaction = await instance.getTransaction();
            const instanceCategory = await instanceTransaction.getCategory();
            const instanceShop = await instanceTransaction.getShop();
            expect(transactionAttributes.date).to.deep.equal(new Date(instance.date));
            expect(transactionAttributes.isExpense).to.equal(instanceTransaction.isExpense);
            expect(transactionAttributes.description).to.equal(instanceTransaction.description);
            expect(transactionAttributes.amount).to.equal(instanceTransaction.amount);
            expect(transactionAttributes.CategoryId).to.equal(instanceCategory.id);
            expect(transactionAttributes.ShopId).to.equal(instanceShop.id);
            expect(await instance.getUser()).to.deep.equal(user);
        });

        it('should also return associated transactions, categories and shops for the created instance', async function () {
            const user = await User.findOne();
            const instance = await oneoffTransactionController.create(user, {
                isExpense: true,
                date: '2022-01-01',
                amount: 1,
                CategoryId: (await Category.create({ name: 'test', UserId: user.id })).id,
                ShopId: (await Shop.findOne({ name: 'shop', UserId: user.id })).id
            });
            expect(instance.Transaction.id).to.exist;
            expect(instance.Transaction.Category.id).to.exist;
            expect(instance.Transaction.Shop.id).to.exist;
        });
    });

    describe('#fetch', function () {
        it('should return fail if body is not an object', async function () {
            expect(
                oneoffTransactionController.fetch(await User.findOne(), 100, 0)
            ).to.be.rejectedWith(/TypeError/);
        });

        it('should return all instances if an empty object is provided', async function () {
            const query = await oneoffTransactionController.fetch(await User.findOne(), 100, 0, {});
            expect(query).to.be.lengthOf(8);
        });

        it('should apply isExpense attribute correctly', async function () {
            const query = await oneoffTransactionController.fetch(await User.findOne(), 100, 0, {
                isExpense: true
            });
            expect(query).to.be.lengthOf(6);
            const query2 = await oneoffTransactionController.fetch(await User.findOne(), 100, 0, {
                isExpense: false
            });
            expect(query2).to.be.lengthOf(2);
        });

        describe('{ dateFrom }', function () {
            it('should apply dateFrom (string) attributes correctly', async function () {
                const testData = await oneoffTransactionController.fetch(
                    await User.findOne(),
                    100,
                    0,
                    {
                        dateFrom: '2020-01-01'
                    }
                );
                expect(testData).to.have.lengthOf(5);
                testData.forEach((oneoffTransaction) => {
                    expect(new Date(oneoffTransaction.date)).to.be.at.least(new Date('2020-01-01'));
                });
            });

            it('should apply dateFrom (date) attributes correctly', async function () {
                const testData = await oneoffTransactionController.fetch(
                    await User.findOne(),
                    100,
                    0,
                    {
                        dateFrom: new Date('2020-01-01')
                    }
                );
                expect(testData).to.have.lengthOf(5);
                testData.forEach((oneoffTransaction) => {
                    expect(new Date(oneoffTransaction.date)).to.be.at.least(new Date('2020-01-01'));
                });
            });
        });

        describe('{ dateTo }', function () {
            it('should apply dateTo (string) attributes correctly', async function () {
                const testData = await oneoffTransactionController.fetch(
                    await User.findOne(),
                    100,
                    0,
                    {
                        dateTo: '2020-01-01'
                    }
                );
                expect(testData).to.have.lengthOf(3);
                testData.forEach((oneoffTransaction) => {
                    expect(new Date(oneoffTransaction.date)).to.be.at.most(new Date('2020-01-01'));
                });
            });

            it('should apply dateTo (date) attributes correctly', async function () {
                const testData = await oneoffTransactionController.fetch(
                    await User.findOne(),
                    100,
                    0,
                    {
                        dateTo: new Date('2020-01-01')
                    }
                );
                expect(testData).to.have.lengthOf(3);
                testData.forEach((oneoffTransaction) => {
                    expect(new Date(oneoffTransaction.date)).to.be.at.most(new Date('2020-01-01'));
                });
            });

            it('should return nothing if dateFrom > dateTo (using strings)', async function () {
                const query = await oneoffTransactionController.fetch(
                    await User.findOne(),
                    100,
                    0,
                    {
                        dateFrom: '2022-01-01',
                        dateTo: '2000-01-01'
                    }
                );
                expect(query).to.be.empty;
            });

            it('should return nothing if dateFrom > dateTo (using dates)', async function () {
                const query = await oneoffTransactionController.fetch(
                    await User.findOne(),
                    100,
                    0,
                    {
                        dateFrom: new Date('2022-01-01'),
                        dateTo: new Date('2000-01-01')
                    }
                );
                expect(query).to.be.empty;
            });
        });

        it('should apply amountFrom attribute correctly', async function () {
            const testData = await oneoffTransactionController.fetch(await User.findOne(), 100, 0, {
                amountFrom: 10000
            });
            expect(testData).to.have.lengthOf(5);
            testData.forEach((oneoffTransaction) => {
                expect(oneoffTransaction.Transaction.amount).to.be.at.least(10000);
            });
        });

        it('should apply amountTo attribute correctly', async function () {
            const testData = await oneoffTransactionController.fetch(await User.findOne(), 100, 0, {
                amountTo: 10000
            });
            expect(testData).to.have.lengthOf(4);
            testData.forEach((oneoffTransaction) => {
                expect(oneoffTransaction.Transaction.amount).to.be.at.most(10000);
            });
        });

        it('should return nothing if amountFrom > amountTo', async function () {
            const query = await oneoffTransactionController.fetch(await User.findOne(), 100, 0, {
                amountFrom: 10000,
                amountTo: 1
            });
            expect(query).to.be.empty;
        });

        it('should apply CategoryId attribute correctly', async function () {
            const user = await User.findOne();
            const category = await Category.findOne({
                where: { UserId: user.id, name: 'property' }
            });
            const testData = await oneoffTransactionController.fetch(user, 100, 0, {
                CategoryId: category.id
            });
            expect(testData).to.have.lengthOf(1);
            expect(testData[0].Transaction.Category.name).to.be.equal('property');
        });

        it('should apply ShopId attribute correctly', async function () {
            const user = await User.findOne();
            const shop = await Shop.findOne({ where: { UserId: user.id, name: 'hardware store' } });
            const testData = await oneoffTransactionController.fetch(user, 100, 0, {
                ShopId: shop.id
            });
            expect(testData).to.have.lengthOf(1);
            expect(testData[0].Transaction.Shop.name).to.be.equal('hardware store');
        });

        it('should apply limit attribute correctly', async function () {
            const testData = await oneoffTransactionController.fetch(
                await User.findOne(),
                3,
                0,
                {}
            );
            expect(testData).to.have.lengthOf(3);
        });

        it('should apply offset attribute correctly', async function () {
            // skip first 6 rows, expect the remaining two
            const testData = await oneoffTransactionController.fetch(
                await User.findOne(),
                10,
                6,
                {}
            );
            expect(testData).to.have.lengthOf(2);
        });

        it('should order the transactions by date ASC, then by id ASC', async function () {
            const user = await User.findOne();
            const parameters = {
                isExpense: true,
                date: new Date('2020-01-01'),
                description: 'test-transaction',
                amount: '1',
                CategoryId: (await Category.findOne()).id,
                ShopId: (await Category.findOne()).id
            };
            const instance = await oneoffTransactionController.create(user, parameters);
            const instance2 = await oneoffTransactionController.create(user, parameters);
            const query = await oneoffTransactionController.fetch(user, 100, 0, {});
            expect(query).to.be.of.length(10);
            expect(JSON.stringify(query[3])).to.equal(JSON.stringify(instance));
            expect(JSON.stringify(query[4])).to.equal(JSON.stringify(instance2));
        });

        it('should also fetch associated transactions, categories and shops', async function () {
            const query = await oneoffTransactionController.fetch(await User.findOne(), 100, 0, {});
            expect(query[0].Transaction.id).to.exist;
            expect(query[0].Transaction.Shop.id).to.exist;
            expect(query[0].Transaction.Category.id).to.exist;
        });

        it('should only fetch transactions of the provided user', async function () {
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            await oneoffTransactionController.create(newUser, {
                date: '2023-01-01',
                isExpense: true,
                amount: 1,
                CategoryId: (await Category.create({ name: 'test', UserId: newUser.id })).id
            });
            expect(await oneoffTransactionController.fetch(newUser, 100, 0, {})).to.be.of.length(1);
        });
    });

    describe('#getbyIdAndUser', function () {
        it('should get one-off transactions by id', async function () {
            const user = await User.findOne();
            const firstInstance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const instance = await oneoffTransactionController.getByUserAndId(
                user,
                firstInstance.id
            );
            expect(instance.id).to.equal(firstInstance.id);
        });

        it('should also fetch associated transactions, categories and shops', async function () {
            const user = await User.findOne();
            const firstInstance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const instance = await oneoffTransactionController.getByUserAndId(
                user,
                firstInstance.id
            );
            expect(instance.Transaction.id).to.exist;
            expect(instance.Transaction.Shop.id).to.exist;
            expect(instance.Transaction.Category.id).to.exist;
        });

        it('should return an 404 http error if the transaction belongs to another user', async function () {
            const oldUser = await User.findOne();
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await OneoffTransaction.findOne({ where: { UserId: oldUser.id } });
            expect(
                oneoffTransactionController.getByUserAndId(newUser, instance.id)
            ).to.be.rejectedWith(/Not Found/);
        });
    });

    describe('#delete', function () {
        it('should delete one-off transactions by id', async function () {
            const user = await User.findOne();
            const countBefore = await OneoffTransaction.count({ where: { UserId: user.id } });
            const instance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            await oneoffTransactionController.delete(user, instance.id);
            expect(await OneoffTransaction.count({ where: { UserId: user.id } })).to.be.equal(
                countBefore - 1
            );
        });

        it('should also delete the associated base transaction', async function () {
            const user = await User.findOne();
            const instance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const oneoffTransactionId = instance.id;
            const transactionId = instance.Transaction.id;
            await oneoffTransactionController.delete(user, instance.id);
            expect(await OneoffTransaction.findByPk(oneoffTransactionId)).to.be.null;
            expect(await Transaction.findByPk(transactionId)).to.be.null;
        });

        it('should return an 404 http error if the primary key is invalid', async function () {
            await expect(
                oneoffTransactionController.delete(await User.findOne(), -1)
            ).to.be.rejectedWith(createError[404]);
        });

        it('should return an 404 http error if the transaction belongs to another user', async function () {
            const oldUser = await User.findOne();
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await OneoffTransaction.findOne({ where: { UserId: oldUser.id } });
            expect(oneoffTransactionController.delete(newUser, instance.id)).to.be.rejectedWith(
                createError.NotFound
            );
        });
    });

    describe('#update', function () {
        it('should return the same instance if no body is provided', async function () {
            const user = await User.findOne();
            const instance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const updatedInstance = await oneoffTransactionController.update(user, instance.id);
            expect(JSON.parse(JSON.stringify(instance))).to.be.deep.equal(
                JSON.parse(JSON.stringify(updatedInstance))
            );
        });

        it('should return the same instance if body is empty', async function () {
            const user = await User.findOne();
            const instance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const updatedInstance = await oneoffTransactionController.update(user, instance.id, {});
            expect(JSON.parse(JSON.stringify(instance))).to.be.deep.equal(
                JSON.parse(JSON.stringify(updatedInstance))
            );
        });

        it('should modify the body with the provided data', async function () {
            const user = await User.findOne();
            const instance = await OneoffTransaction.findOne({ where: { UserId: user.id } });
            const updatedInstance = await oneoffTransactionController.update(user, instance.id, {
                amount: 12345,
                date: '2023-01-04',
                CategoryId: (await Category.create({ name: 'update-test', UserId: user.id })).id,
                ShopId: (await Shop.create({ name: 'update-test', UserId: user.id })).id,
                description: 'testing update method ...'
            });
            expect(new Date(updatedInstance.date)).to.be.deep.equal(new Date('2023-01-04'));
            expect(updatedInstance.Transaction.amount).to.be.equal(12345);
            expect(updatedInstance.Transaction.description).to.be.equal(
                'testing update method ...'
            );
            expect(updatedInstance.Transaction.Category.name).to.be.equal('update-test');
            expect(updatedInstance.Transaction.Shop.name).to.be.equal('update-test');
            expect(updatedInstance.updatedAt).to.be.above(instance.updatedAt);
            expect(new Date(updatedInstance.Transaction.updatedAt)).to.be.above(
                new Date(instance.Transaction.updatedAt)
            );
        });

        it('should apply setting ShopId to null', async function () {
            const user = await User.findOne();
            const instance = await oneoffTransactionController.create(user, {
                isExpense: true,
                date: '2023-01-01',
                amount: 1,
                CategoryId: (await Category.findOne()).id,
                ShopId: (await Shop.findOne()).id
            });
            const updatedInstance = await oneoffTransactionController.update(user, instance.id, {
                ShopId: null
            });
            expect(updatedInstance.Transaction.ShopId).to.be.null;
        });

        it('should return an 404 http error if the primary key is invalid', async function () {
            await expect(
                oneoffTransactionController.update(await User.findOne(), -1, {})
            ).to.be.rejectedWith(createError[404]);
        });

        it('should return an 404 http error if the transaction belongs to another user', async function () {
            const oldUser = await User.findOne();
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await OneoffTransaction.findOne({ where: { UserId: oldUser.id } });
            expect(oneoffTransactionController.update(newUser, instance.id, {})).to.be.rejectedWith(
                createError.NotFound
            );
        });
    });
});
