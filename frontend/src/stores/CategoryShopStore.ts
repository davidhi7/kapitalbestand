import { defineStore } from 'pinia';

import HttpError from '@/HttpError';

type CategoryShop = {
    id: number;
    name: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
};

type CategoryShopWithoutMeta = {
    id: number;
    name: string;
};

/**
 * Widest value type of the category/shop autocompletes. `name` is for display
 * only; `id` identifies the instance. `id: null` marks the shop-filter option
 * for transactions without a shop and never occurs outside filtering — use
 * `CategoryWithoutMeta`/`ShopWithoutMeta` wherever a real instance is required.
 */
export type CategoryShopOption = { id: number | null; name: string };

export type CategoryShopType = 'category' | 'shop';

export type Category = CategoryShop;
export type CategoryWithoutMeta = CategoryShopWithoutMeta;
export type Shop = CategoryShop;
export type ShopWithoutMeta = CategoryShopWithoutMeta;

type ConditionalType<T extends CategoryShopType> = T extends 'Category'
    ? Category
    : Shop;

interface State {
    categories: { [name: string]: Category };
    shops: { [name: string]: Shop };
}

export const useCategoryShopStore = defineStore('CategoryShop', {
    state: (): State => {
        return {
            categories: {},
            shops: {}
        };
    },
    actions: {
        target(type: CategoryShopType): {
            targetArray: { [name: string]: CategoryShop };
            endpoint: string;
        } {
            if (type === 'category') {
                return {
                    targetArray: this.categories,
                    endpoint: '/api/categories'
                };
            } else {
                return { targetArray: this.shops, endpoint: '/api/shops' };
            }
        },
        async create(
            type: CategoryShopType,
            name: string
        ): Promise<ConditionalType<typeof type>> {
            const { targetArray, endpoint } = this.target(type);
            const response = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ name }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }
            const instance = (await response.json()).data;
            targetArray[instance.name] = instance;
            return instance;
        },
        async fetch() {
            const [categories, shops]: [Category[], Shop[]] = await Promise.all(
                [
                    fetch('/api/categories')
                        .then((res) => res.json())
                        .then((json) => json.data),
                    fetch('/api/shops')
                        .then((res) => res.json())
                        .then((json) => json.data)
                ]
            );
            for (const category of categories) {
                this.categories[category.name] = category;
            }
            for (const shop of shops) {
                this.shops[shop.name] = shop;
            }
        },
        async update(
            type: CategoryShopType,
            id: number,
            name: string
        ): Promise<ConditionalType<typeof type>> {
            const { targetArray, endpoint } = this.target(type);
            const response = await fetch(`${endpoint}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ name }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }
            const instance = (await response.json()).data;
            const oldKey = Object.keys(targetArray).find(
                (key) => targetArray[key].id === id
            );
            if (oldKey !== undefined) {
                delete targetArray[oldKey];
            }
            targetArray[instance.name] = instance;
            return instance;
        },
        async delete(type: CategoryShopType, id: number) {
            const { targetArray, endpoint } = this.target(type);
            const response = await fetch(`${endpoint}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }
            const oldKey = Object.keys(targetArray).find(
                (key) => targetArray[key].id === id
            );
            if (oldKey !== undefined) {
                delete targetArray[oldKey];
            }
        }
    }
});
