import type {
    MonthlyTransactionCreateParameters,
    MonthlyTransactionQueryParameters as MonthlyTransactionQueryParameters_
} from '../controllers/transaction/MonthlyTransactionController.js';
import type {
    OneoffTransactionCreateParameters,
    OneoffTransactionQueryParameters as OneoffTransactionQueryParameters_
} from '../controllers/transaction/OneoffTransactionController.js';
import { BaseFetchParameters } from '../controllers/types.js';
import type { Category, Shop } from './CategoryShopTypes.js';
import type { Timestamps } from './commonTypes.js';

export { OneoffTransactionCreateParameters, MonthlyTransactionCreateParameters };

export type OneoffTransactionQueryParameters = Omit<
    OneoffTransactionQueryParameters_,
    keyof BaseFetchParameters
> &
    Partial<BaseFetchParameters>;
export type MonthlyTransactionQueryParameters = Omit<
    MonthlyTransactionQueryParameters_,
    keyof BaseFetchParameters
> &
    Partial<BaseFetchParameters>;

export type Transaction = {
    id: number;
    isExpense: boolean;
    amount: number;
    description: string;
    CategoryId: number;
    Category: Category;
    ShopId?: number;
    Shop?: Shop;
} & Timestamps;

export type OneoffTransaction = {
    id: number;
    date: string;
    TransactionId: number;
    Transaction: Transaction;
    UserId: number;
} & Timestamps;

export type MonthlyTransaction = {
    id: number;
    monthFrom: string;
    monthTo: string | null;
    TransactionId: number;
    Transaction: Transaction;
    UserId: number;
} & Timestamps;
