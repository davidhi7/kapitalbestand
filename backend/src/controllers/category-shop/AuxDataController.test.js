import { expect } from 'chai';

import { Category, Shop, User } from '../db.js';
import {
    categoryController,
    shopController,
    categoryShopIdResolver
} from './AuxDataController.js';

describe('AuxDataController', function () {
    describe('#count', function () {
        it('should return the correct count', async () => {
            const user = await User.findOne();
            const count0 = await await categoryController.count(user);
            await Category.create({
                UserId: user.id,
                name: 'test-category'
            });
            const count1 = await await categoryController.count(user);
            expect(count1 - count0).to.equal(1);
        });
    });
    describe('#findOrCreate', function () {
        it('should create the new category as it does not exist yet', async function () {
            const user = await User.findOne();
            const count0 = await await categoryController.count(user);
            const instance = await await categoryController.findOrCreate(user, 'test-findOrCreate');
            expect(instance.name).to.equal('test-findOrCreate');
            expect(await await categoryController.count(user)).to.equal(count0 + 1);
        });
        it('should not create the new category but return the identically-named existing instance', async function () {
            const user = await User.findOne();
            const count0 = await await categoryController.count(user);
            const instance = await await categoryController.findOrCreate(user, 'electronics');
            expect(instance.name).to.equal('electronics');
            expect(await await categoryController.count(user)).to.equal(count0);
        });
    });
    describe('#fetch', function () {
        it('should return all categorites', async () => {
            const user = await User.findOne();
            const instances = await await categoryController.fetch(user);
            expect(instances).to.be.deep.equal(await Category.findAll({ where: { UserId: user.id } }));
        });
        it('should only return instances belonging to the user', async () => {
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            await Category.create({
                UserId: newUser.id,
                name: 'test-category'
            });
            const query = await await categoryController.fetch(newUser);
            expect(query).to.be.lengthOf(1);
            expect(query[0].name).to.equal('test-category');
        });
    });
    describe('#fetchNames', function () {
        it('should return all categorites', async () => {
            const user = await User.findOne();
            const names = await await categoryController.fetchNames(user);
            expect(names).to.be.deep.equal(
                (await Category.findAll({ where: { UserId: user.id } })).map((instance) => instance.name)
            );
        });
        it('should only return instances belonging to the user', async () => {
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            await Category.create({
                UserId: newUser.id,
                name: 'test-category'
            });
            const query = await await categoryController.fetchNames(newUser);
            expect(query).to.be.lengthOf(1);
            expect(query[0]).to.equal('test-category');
        });
    });
    describe('#validateId', () => {
        it('should return true if the id belong to the user', async () => {
            const user = await User.findOne();
            const category = await Category.create({
                name: 'test-cat',
                UserId: user.id
            });
            expect(await categoryController.validateId(user, category.id)).to.be.true;
        });
        it('should return false if the id does not belong to the user', async () => {
            const user = await User.findOne();
            const foreignUser = await User.create({
                username: 'user2',
                hash: 'hash'
            });
            const category = await Category.create({
                name: 'test-cat',
                UserId: foreignUser.id
            });
            expect(await categoryController.validateId(user, category.id)).to.be.false;
        });
        it('should return false if the id does not exist', async () => {
            const user = await User.findOne();
            expect(await categoryController.validateId(user, 999)).to.be.false;
        });
        it('should return true for the value `null` with `allowNull` being set to true', async () => {
            expect(await categoryController.validateId(await User.findOne(), null, true)).to.be.true;
        });
        it('should return false for the value `null` with `allowNull` being set to false', async () => {
            expect(await categoryController.validateId(await User.findOne(), null, false)).to.be.false;
        });
        it('should return false if any other value than `null` or integers is provided', async () => {
            const user = await User.findOne();
            expect(await categoryController.validateId(user, undefined)).to.be.false;
            expect(await categoryController.validateId(user, '1')).to.be.false;
            expect(await categoryController.validateId(user, {})).to.be.false;
        })
    })
});
describe('categoryShopResolver', function () {
    it('should return a copy with ids set to null if no name fields are provided', async function () {
        const user = await User.findOne();
        const data = {
            zero: 0,
            one: 1
        };
        const dataWithIds = await categoryShopIdResolver(user, data);
        expect(dataWithIds).not.to.equal(data);
        expect(dataWithIds).to.deep.equal({
            zero: 0,
            one: 1,
            CategoryId: null,
            ShopId: null
        });
    });
    it('should resolve the category and shop ids without creating new instances', async function () {
        const user = await User.findOne();
        const data = {
            category: 'groceries',
            shop: 'supermarket'
        };
        const initialCategoryCount = await await categoryController.count(user);
        const initialShopCount = await shopController.count(user);
        const dataWithIds = await categoryShopIdResolver(user, data);
        const expectedCategory = await Category.findOne({
            where: {
                UserId: user.id,
                name: 'groceries'
            }
        });
        const expectedShop = await Shop.findOne({
            where: {
                UserId: user.id,
                name: 'supermarket'
            }
        });

        expect(dataWithIds).to.deep.equal({
            CategoryId: expectedCategory.id,
            ShopId: expectedShop.id
        });
        expect(initialCategoryCount).to.equal(await await categoryController.count(user));
        expect(initialShopCount).to.equal(await shopController.count(user));
    });
    it('should resolve the category and shop ids by creating new instances', async function () {
        const user = await User.findOne();
        const data = {
            category: 'cat-test',
            shop: 'shop-test'
        };
        const initialCategoryCount = await await categoryController.count(user);
        const initialShopCount = await shopController.count(user);
        const dataWithIds = await categoryShopIdResolver(user, data);
        const categoryInstance = await Category.findOne({
            where: {
                UserId: user.id,
                name: 'cat-test'
            }
        });
        const shopInstance = await Shop.findOne({
            where: {
                UserId: user.id,
                name: 'shop-test'
            }
        });

        expect(dataWithIds).to.deep.equal({
            CategoryId: categoryInstance.id,
            ShopId: shopInstance.id
        });
        expect(initialCategoryCount + 1).to.equal(await await categoryController.count(user));
        expect(initialShopCount + 1).to.equal(await shopController.count(user));
    });
    it('should handle empty names by setting ids to null', async () => {
        const user = await User.findOne();
        expect(
            await categoryShopIdResolver(user, {
                category: '',
                shop: ''
            })
        ).to.deep.equal({
            CategoryId: null,
            ShopId: null
        });
    });
    it('should handle null names by setting ids to null', async () => {
        const user = await User.findOne();
        expect(
            await categoryShopIdResolver(user, {
                category: null,
                shop: null
            })
        ).to.deep.equal({
            CategoryId: null,
            ShopId: null
        });
    });
    it('should handle undefined names by setting ids to null', async () => {
        const user = await User.findOne();
        expect(
            await categoryShopIdResolver(user, {
                category: undefined,
                shop: undefined
            })
        ).to.deep.equal({
            CategoryId: null,
            ShopId: null
        });
    });
});
