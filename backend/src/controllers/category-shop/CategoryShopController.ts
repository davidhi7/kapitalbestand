import createHttpError from 'http-errors';

import { Category, Shop, User } from '../../database/db.js';

export type CategoryOrShop = typeof Category | typeof Shop;

async function getByUserAndId(
    model: CategoryOrShop,
    user: User,
    id: number
): Promise<Category | Shop> {
    const instance = await model.findByPk(id);
    if (!instance) {
        throw createHttpError.NotFound();
    }
    if (instance.UserId !== user.id) {
        throw createHttpError.Forbidden();
    }
    return instance;
}

async function createInstance(
    model: CategoryOrShop,
    user: User,
    name: string
): Promise<Category | Shop> {
    try {
        return await model.create({
            name,
            UserId: user.id
        });
    } catch (error) {
        throw createHttpError.BadRequest();
    }
}

async function deleteInstance(model: CategoryOrShop, user: User, id: number): Promise<void> {
    const instance = await getByUserAndId(model, user, id);
    await instance.destroy();
}

async function update(
    model: CategoryOrShop,
    user: User,
    id: number,
    name: string
): Promise<Category | Shop> {
    const instance = await getByUserAndId(model, user, id);
    instance.name = name;
    await instance.save();
    return instance;
}

async function fetch(
    model: CategoryOrShop,
    user: User,
    limit: number,
    offset: number,
    name?: string
): Promise<Category[] | Shop[]> {
    const whereClause: Record<string, string | number> = {
        UserId: user.id
    };
    if (name) {
        whereClause['name'] = name;
    }
    return await model.findAll({
        where: whereClause,
        limit: limit,
        offset: offset
    });
}

export default {
    create: createInstance,
    delete: deleteInstance,
    update,
    fetch,
    getById: getByUserAndId
};
