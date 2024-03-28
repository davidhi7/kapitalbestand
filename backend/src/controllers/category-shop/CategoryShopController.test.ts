import { expect } from 'chai';

import { Category, User } from '../../database/db.js';
import CategoryShopController from './CategoryShopController.js';

describe('CategoryShopController', function () {
    describe('#getByUserAndId', function () {
        it('should return the category', async function () {
            const user = await User.findOne();
            const expectedInstance = await Category.findOne();
            const instance = await CategoryShopController.getById(
                Category,
                user!,
                expectedInstance!.id
            );
            expect(instance).to.be.deep.equal(expectedInstance);
        });

        it('should raise throw `Not Found` if no category belongs to the id', async function () {
            const user = await User.findOne();
            expect(CategoryShopController.getById(Category, user!, -1)).to.be.rejectedWith(
                /Not Found/
            );
        });

        it('should throw `Forbidden` if the if a different user owns the category', async function () {
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await Category.findOne();
            expect(
                CategoryShopController.getById(Category, newUser!, instance!.id)
            ).to.be.rejectedWith(/Forbidden/);
        });
    });

    describe('#createInstance', function () {
        it('should create and return the instance', async function () {
            const user = await User.findOne();
            const instance = await CategoryShopController.create(Category, user!, 'test-category');
            expect(instance.name).to.be.equal('test-category');
        });

        it('should throw `Bad Request` if a duplicate category would be created', async function () {
            const user = await User.findOne();
            await CategoryShopController.create(Category, user!, 'test-category');
            expect(
                CategoryShopController.create(Category, user!, 'test-category')
            ).to.be.rejectedWith(/Bad Request/);
        });
    });

    describe('#deleteInstance', function () {
        it('should delete the instance', async function () {
            const user = await User.findOne();
            const instance = await Category.findOne();
            await CategoryShopController.delete(Category, user!, instance!.id);
            expect(await Category.findByPk(instance!.id)).to.be.null;
        });

        it('should throw `Not Found` if the instance does not exist', async function () {
            const user = await User.findOne();
            expect(CategoryShopController.delete(Category, user!, -1)).to.be.rejectedWith(
                /Not Found/
            );
        });

        it('should throw `Forbidden` if the instance belongs to another user', async function () {
            const user = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await Category.findOne();
            expect(CategoryShopController.delete(Category, user!, instance!.id)).to.be.rejectedWith(
                /Forbidden/
            );
        });
    });

    describe('#update', function () {
        it('should update the instance', async function () {
            const user = await User.findOne();
            const instance = await Category.create({
                UserId: user!.id,
                name: 'testcategory'
            });
            const updatedInstance = await CategoryShopController.update(
                Category,
                user!,
                instance.id,
                'testcategory-update'
            );
            expect(updatedInstance.name).to.be.equal('testcategory-update');
            expect(updatedInstance.id).to.be.equal(instance.id);
            expect(updatedInstance.createdAt.getTime()).to.be.equal(instance.createdAt.getTime());
            expect(updatedInstance.updatedAt.getTime()).not.to.be.equal(
                instance.updatedAt.getTime()
            );
        });

        it('should throw `Not Found` if the instance does not exist', async function () {
            const user = await User.findOne();
            expect(
                CategoryShopController.update(Category, user!, -1, 'updatedname')
            ).to.be.rejectedWith(/Not Found/);
        });

        it('should throw `Forbidden` if the instance belongs to another user', async function () {
            const user = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            const instance = await Category.findOne();
            expect(
                CategoryShopController.update(Category, user!, instance!.id, 'updatedname')
            ).to.be.rejectedWith(/Forbidden/);
        });
    });

    describe('#fetch', function () {
        it('should return all categorites', async function () {
            const user = await User.findOne();
            const instances = await CategoryShopController.fetch(Category, user!, 100, 0);
            expect(instances).to.be.deep.equal(
                await Category.findAll({ where: { UserId: user!.id } })
            );
        });

        it('should only return instances belonging to the user', async function () {
            const newUser = await User.create({
                username: 'testuser2',
                hash: 'securehash'
            });
            await Category.create({
                UserId: newUser.id,
                name: 'test-category'
            });
            const query = await CategoryShopController.fetch(Category, newUser!, 100, 0);
            expect(query).to.be.lengthOf(1);
            expect(query[0].name).to.equal('test-category');
        });

        it('should apply `offset` and `limit` correctly', async function () {
            const user = await User.findOne();
            const allInstances = await Category.findAll({
                where: {
                    UserId: user!.id
                }
            });
            expect(await CategoryShopController.fetch(Category, user!, 1, 0)).to.be.deep.equal(
                allInstances.slice(0, 1)
            );
            expect(await CategoryShopController.fetch(Category, user!, 2, 1)).to.be.deep.equal(
                allInstances.slice(1, 3)
            );
        });

        it('should respect the `name` query parameter', async function () {
            const user = await User.findOne();
            const instance = await Category.create({
                UserId: user!.id,
                name: 'testcategory'
            });
            const query = await CategoryShopController.fetch(
                Category,
                user!,
                100,
                0,
                'testcategory'
            );
            expect(query).to.be.length(1);
            expect(query[0].id).to.be.deep.equal(instance.id);
        });

        it('should return an empty array if the `name` query does not match a category', async function () {
            const user = await User.findOne();
            expect(
                await CategoryShopController.fetch(Category, user!, 100, 0, 'testcategory')
            ).to.be.length(0);
        });
    });
});
