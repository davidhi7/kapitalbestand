import { defineStore } from 'pinia';

export const useCategoryShopStore = defineStore('CategoryShop', {
    state: () => {
        return {
            categoryNames: [],
            shopNames: []
        };
    },
    actions: {
        async fetch() {
            const [categories, shops] = await Promise.all([
                fetch('/api/categories/names').then((res) => res.json()),
                fetch('/api/shops/names').then((res) => res.json())
            ]);
            this.categoryNames = categories.data;
            this.shopNames = shops.data;
        }
    }
});
