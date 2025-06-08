import { defineStore } from 'pinia';

import HttpError from '@/HttpError';
import { dateToIsoDate } from '@/common';
import { Category, Shop } from '@/stores/CategoryShopStore';

export enum Ordering {
    Asc = 'Asc',
    Desc = 'Desc'
}

export enum OrderKey {
    Time = 'Time',
    Amount = 'Amont',
    Category = 'Category',
    Shop = 'Shop'
}

export type OrderSettings = {
    ordering: Ordering;
    orderKey: OrderKey;
};

export type TransactionType = 'oneoff' | 'monthly';

type BaseTransaction = {
    id: number;
    userId: number;
    isExpense: boolean;
    amount: number;
    description?: string;
    categoryId: number;
    category: string;
    shopId?: number;
    shop?: string;
    createdAt: string;
    updatedAt: string;
};

export type OneoffTransaction = {
    date: string;
} & BaseTransaction;

export type MonthlyTransaction = {
    monthFrom: string;
    monthTo?: string;
} & BaseTransaction;

type BaseTransactionCreateParams = {
    isExpense: boolean;
    amount: number;
    description?: string;
    categoryId: number;
    shopId?: number;
};

type OneoffTransactionCreateParams = {
    date: string;
} & BaseTransactionCreateParams;

type MonthlyTransactionCreateParams = {
    monthFrom: string;
    monthTo?: string;
} & BaseTransactionCreateParams;

export type CreateParams<T extends TransactionType> = T extends 'oneoff'
    ? OneoffTransactionCreateParams
    : MonthlyTransactionCreateParams;

type BaseTransactionQueryParams = {
    isExpense?: boolean;
    amountFrom?: number;
    amountTo?: number;
    categoryId?: number;
    shopId?: number | null;
} & OrderSettings;

type OneoffTransactionQueryParams = {
    dateFrom?: string;
    dateTo?: string;
} & BaseTransactionQueryParams;

type MonthlyTransactionQueryParams = {
    monthFrom?: string;
    monthTo?: string | null;
} & BaseTransactionQueryParams;

export type QueryParams<T extends TransactionType> = T extends 'oneoff'
    ? OneoffTransactionQueryParams
    : MonthlyTransactionQueryParams;

type BaseTransactionUpdateParams = {
    isExpense?: boolean;
    amount?: number;
    description?: string | null;
    categoryId?: number;
    shopId?: number | null;
};

type OneoffTransactionUpdateParams = {
    date?: string;
} & BaseTransactionUpdateParams;

type MonthlyTransactionUpdateParams = {
    monthFrom?: string;
    monthTo?: string | null;
} & BaseTransactionUpdateParams;

export type UpdateParams<T extends TransactionType> = BaseTransactionUpdateParams &
    T extends 'oneoff'
    ? OneoffTransactionUpdateParams
    : MonthlyTransactionUpdateParams;

export type TransactionFilterRules = {
    isMonthlyTransaction: boolean;
    isExpense?: boolean;
    dateFrom?: string;
    dateTo?: string;
    monthFrom?: string;
    monthTo?: string;
    amountFrom?: number;
    amountTo?: number;
    Category?: Category;
    Shop?: Shop;
    order: OrderSettings;
};

export function isOneoffTransaction(
    transaction: OneoffTransaction | MonthlyTransaction
): transaction is OneoffTransaction {
    return (transaction as OneoffTransaction).date != undefined;
}
const currentDate = new Date();

interface State {
    transactionFilterRules: TransactionFilterRules;
    transactions: (OneoffTransaction | MonthlyTransaction)[];
}

export const useTransactionStore = defineStore('Transaction', {
    state: (): State => {
        return {
            transactionFilterRules: {
                dateFrom: dateToIsoDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                ),
                monthFrom: `${currentDate.getFullYear()}-01`,
                isMonthlyTransaction: false,
                order: {
                    ordering: Ordering.Asc,
                    orderKey: OrderKey.Time
                }
            },
            transactions: []
        };
    },
    actions: {
        async create<T extends TransactionType>(type: T, payload: CreateParams<T>) {
            const response = await fetch(`/api/transactions/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }

            // Only fetch transactions if currently filtered transaction type is equal to type of just created transaction
            const isMonthlyTransaction =
                (payload as OneoffTransactionCreateParams).date == undefined;
            if (isMonthlyTransaction === this.transactionFilterRules.isMonthlyTransaction) {
                this.fetch();
            }
        },
        async fetch() {
            // Not pretty but simplest solution
            // const payload: Partial<Record<keyof QueryParams<T>, string>> = {};
            // ^ this code doesn't work
            const payload: Partial<
                Record<keyof (OneoffTransactionQueryParams & MonthlyTransactionQueryParams), string>
            > = {};
            let filters = this.transactionFilterRules;
            let endpoint: string;

            if (!filters.isMonthlyTransaction) {
                endpoint = '/api/transactions/oneoff';
                if (filters.dateFrom !== undefined) {
                    payload['dateFrom'] = filters.dateFrom;
                }

                if (filters.dateTo !== undefined) {
                    payload['dateTo'] = filters.dateTo;
                }
            } else {
                endpoint = '/api/transactions/monthly';
                if (filters.monthFrom !== undefined) {
                    payload['monthFrom'] = filters.monthFrom;
                }

                if (filters.monthTo !== undefined) {
                    payload['monthTo'] = filters.monthTo;
                }
            }

            if (filters.isExpense !== undefined) {
                payload['isExpense'] = String(filters.isExpense);
            }

            if (filters.amountFrom !== undefined) {
                payload['amountFrom'] = String(filters.amountFrom);
            }

            if (filters.amountTo !== undefined) {
                payload['amountTo'] = String(filters.amountTo);
            }

            if (filters.Category !== undefined) {
                payload['categoryId'] = String(filters.Category.id);
            }

            if (filters.Shop !== undefined) {
                payload['shopId'] = String(filters.Shop.id);
            }

            if (filters.order.orderKey) {
                payload['orderKey'] = filters.order.orderKey;
            }

            if (filters.order.ordering) {
                payload['ordering'] = filters.order.ordering;
            }

            const response = await fetch(endpoint + '?' + new URLSearchParams(payload));

            if (!response.ok) {
                throw new HttpError(response.status);
            }

            this.transactions = (await response.json()).data;
            return this.transactions;
        },
        async update<T extends TransactionType>(type: T, id: number, payload: UpdateParams<T>) {
            const response = await fetch(`/api/transactions/${type}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }

            for (let i = 0; i < this.transactions.length; i++) {
                if (this.transactions[i].id == id) {
                    this.transactions[i] = (await response.json()).data;
                    return;
                }
            }
        },
        async delete(type: TransactionType, id: number) {
            const endpoint = `/api/transactions/${type}/${id}`;
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }

            for (let i = 0; i < this.transactions.length; i++) {
                if (this.transactions[i].id == id) {
                    this.transactions.splice(i, 1);
                    return;
                }
            }
        }
    }
});
