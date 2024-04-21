import { body } from 'express-validator';

import CategoryShopController, {
    CategoryOrShop
} from '../../controllers/category-shop/CategoryShopController.js';
import { Category, Shop } from '../../database/db.js';
import { EndpointBuilder } from './EndpointBuilder.js';

type CategoryShopParameters = {
    name: string;
};

const nameLengthValidator = body('name').isLength({ min: 1 });

function generateRouterByModel(model: CategoryOrShop) {
    return new EndpointBuilder<CategoryShopParameters, CategoryShopParameters>()
        .post([nameLengthValidator], async (user, body) => {
            return await CategoryShopController.create(model, user, body.name);
        })
        .get([], async (user, limit, offset, { name }) => {
            return await CategoryShopController.fetch(model, user, limit, offset, name);
        })
        .patch([nameLengthValidator], async (user, id, body) => {
            return await CategoryShopController.update(model, user, id, body.name);
        })
        .delete(async (user, id) => {
            await CategoryShopController.delete(model, user, id);
        })
        .getId(async (user, id) => {
            return await CategoryShopController.getById(model, user, id);
        })
        .getRouter();
}

export const categoryRouter = generateRouterByModel(Category);
export const shopRouter = generateRouterByModel(Shop);
