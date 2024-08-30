import type { Timestamps } from './commonTypes.js';

type CategoryShop = {
    id: number;
    name: string;
    UserId: number;
} & Timestamps;

export type Category = CategoryShop;
export type Shop = CategoryShop;
