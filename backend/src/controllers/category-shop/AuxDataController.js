import createError from 'http-errors';

import sequelize, { Category, Shop } from '../../database/db.js';

class AuxDataController {
    constructor(model) {
        this.model = model;
    }

    async findOrCreate(user, name, transaction) {
        const [instance, created] = await this.model.findOrCreate({
            where: {
                UserId: user.id,
                name: name
            },
            transaction: transaction ? transaction : undefined
        });
        return instance;
    }

    async fetch(user) {
        return this.model.findAll({ where: { UserId: user.id } });
    }

    async fetchNames(user) {
        return (await this.model.findAll({ where: { UserId: user.id } })).map((value) => value.name);
    }

    async count(user) {
        return this.model.count({ where: { UserId: user.id } });
    }

    /**
     * Find the id for the name.
     * If no corresponding instance exists, create a new one.
     * If the name is null, undefined or empty, return null.
     * Otherwise return the id.
     * @param {*} user
     * @param {*} name
     * @param {*} transaction
     * @returns instance id
     */
    async resolveName(user, name, transaction) {
        if (name == null || name === '') {
            return null;
        } else {
            const instance = await this.findOrCreate(user, name, transaction);
            return instance.id;
        }
    }

    /**
     * Validate the given id. Return true if there is a corresponding instance that belongs to the user.
     * If `allowNull` is true and the id is null, return also true.
     * Otherwise, return false.
     * @param {*} user
     * @param {*} id
     * @param {*} allowNull
     * @returns validation result
     */
    async validateId(user, id, allowNull) {
        if (id === null) {
            return !!allowNull;
        }
        if (!Number.isInteger(id)) {
            return false;
        }
        const instance = await this.model.findOne({
            where: {
                UserId: user.id,
                id: id
            }
        });
        return instance !== null;
    }
}

export const categoryController = new AuxDataController(Category);
export const shopController = new AuxDataController(Shop);

/**
 * Return a clone of the provided body with category and shop names replaced with their corresponding id.
 * If matching category or shop instances do not exist, create a new one.
 * If the name values are null, undefined or empty, set the id to null.
 * Otherwise the matching id is set, with the original name values are removed.
 * @param {*} user
 * @param {*} body
 * @returns
 */
export const categoryShopIdResolver = async (user, body) => {
    body = { ...body };
    try {
        const [CategoryId, ShopId] = await sequelize.transaction(async (transaction) => {
            return await Promise.all([
                categoryController.resolveName(user, body.category, transaction),
                shopController.resolveName(user, body.shop, transaction)
            ]);
        });

        body.CategoryId = CategoryId;
        body.ShopId = ShopId;
        delete body.category;
        delete body.shop;
    } catch (error) {
        console.error(error);
    }
    return body;
};
