import { defineStore } from 'pinia';

import { Category, Shop } from '@backend-types/CategoryShopTypes';

import HttpError from '@/HttpError';

interface State {
    categories: Category[];
    shops: Shop[];
}

type ConditionalReturnType<T> = T extends 'Category' ? Category : Shop;
export const useCategoryShopStore = defineStore('CategoryShop', {
    state: (): State => {
        return {
            categories: [],
            shops: []
        };
    },
    actions: {
        async fetch() {
            const [categories, shops] = await Promise.all([
                fetch('/api/categories').then((res) => res.json()),
                fetch('/api/shops').then((res) => res.json())
            ]);
            this.categories = categories.data;
            this.shops = shops.data;
        },
        async create(
            type: 'Category' | 'Shop',
            name: string
        ): Promise<ConditionalReturnType<typeof type>> {
            let targetArray, endpoint;
            if (type === 'Category') {
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
        }
    }
});
