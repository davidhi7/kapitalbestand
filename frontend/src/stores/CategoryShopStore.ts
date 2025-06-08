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

export type CategoryShopType = 'category' | 'shop';

export type Category = CategoryShop;
export type CategoryWithoutMeta = CategoryShopWithoutMeta;
export type Shop = CategoryShop;
export type ShopWithoutMeta = CategoryShopWithoutMeta;

type ConditionalType<T extends CategoryShopType> = T extends 'Category' ? Category : Shop;

interface State {
    categories: Category[];
    shops: Shop[];
}

export const useCategoryShopStore = defineStore('CategoryShop', {
    state: (): State => {
        return {
            categories: [],
            shops: []
        };
    },
    actions: {
        async create(type: CategoryShopType, name: string): Promise<ConditionalType<typeof type>> {
            let targetArray, endpoint;
            if (type === 'category') {
                targetArray = this.categories;
                endpoint = '/api/categories';
            } else {
                targetArray = this.shops;
                endpoint = '/api/shops';
            }
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
            targetArray.push(instance);
            return instance;
        },
        async fetch() {
            const [categories, shops] = await Promise.all([
                fetch('/api/categories').then((res) => res.json()),
                fetch('/api/shops').then((res) => res.json())
            ]);
            this.categories = categories.data;
            this.shops = shops.data;
        }
    }
});
