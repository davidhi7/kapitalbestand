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

export type TransactionType = 'oneoff' | 'recurring';

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

export type MonthlyRecurrence = {
    frequency: 'monthly';
    monthFrom: string;
    monthTo?: string;
};

export type YearlyRecurrence = {
    frequency: 'yearly';
    yearFrom: number;
    yearTo?: number;
};

export type Recurrence = MonthlyRecurrence | YearlyRecurrence;

export type RecurringTransaction = {
    recurrence: Recurrence;
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

type RecurringTransactionCreateParams = {
    recurrence: Recurrence;
} & BaseTransactionCreateParams;

export type CreateParams<T extends TransactionType> = T extends 'oneoff'
    ? OneoffTransactionCreateParams
    : RecurringTransactionCreateParams;

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

type RecurringTransactionQueryParams = {
    frequency?: 'monthly' | 'yearly';
    intervalStartsLe?: string;
    intervalEndsGe?: string;
    isTerminating?: boolean;
} & BaseTransactionQueryParams;

export type QueryParams<T extends TransactionType> = T extends 'oneoff'
    ? OneoffTransactionQueryParams
    : RecurringTransactionQueryParams;

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

type RecurringTransactionUpdateParams = {
    recurrence?: Recurrence;
} & BaseTransactionUpdateParams;

export type UpdateParams<T extends TransactionType> = BaseTransactionUpdateParams &
    T extends 'oneoff'
    ? OneoffTransactionUpdateParams
    : RecurringTransactionUpdateParams;

export type TransactionFilterRules = {
    isRecurringTransaction: boolean;
    isExpense?: boolean;
    dateFrom?: string;
    dateTo?: string;
    frequency?: 'monthly' | 'yearly';
    intervalStartsLe?: string;
    intervalEndsGe?: string;
    isTerminating?: boolean;
    amountFrom?: number;
    amountTo?: number;
    Category?: Category;
    Shop?: Shop;
    order: OrderSettings;
};

export function isOneoffTransaction(
    transaction: OneoffTransaction | RecurringTransaction
): transaction is OneoffTransaction {
    return (transaction as OneoffTransaction).date != undefined;
}
const currentDate = new Date();

interface State {
    transactionFilterRules: TransactionFilterRules;
    transactions: (OneoffTransaction | RecurringTransaction)[];
}

export const useTransactionStore = defineStore('Transaction', {
    state: (): State => {
        return {
            transactionFilterRules: {
                dateFrom: dateToIsoDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                ),
                intervalStartsLe: `${currentDate.getFullYear()}-01`,
                isRecurringTransaction: false,
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
            const isRecurringTransaction =
                (payload as OneoffTransactionCreateParams).date == undefined;
            if (isRecurringTransaction === this.transactionFilterRules.isRecurringTransaction) {
                this.fetch();
            }
        },
        async fetch() {
            const payload: Record<string, string> = {};
            let filters = this.transactionFilterRules;
            let endpoint: string;

            if (!filters.isRecurringTransaction) {
                endpoint = '/api/transactions/oneoff';
                if (filters.dateFrom !== undefined) {
                    payload['dateFrom'] = filters.dateFrom;
                }

                if (filters.dateTo !== undefined) {
                    payload['dateTo'] = filters.dateTo;
                }
            } else {
                endpoint = '/api/transactions/recurring';

                if (filters.frequency !== undefined) {
                    payload['frequency'] = filters.frequency;
                }

                if (filters.intervalStartsLe !== undefined) {
                    payload['intervalStartsLe'] = filters.intervalStartsLe;
                }

                if (filters.intervalEndsGe !== undefined) {
                    payload['intervalEndsGe'] = filters.intervalEndsGe;
                }

                if (filters.isTerminating !== undefined) {
                    payload['isTerminating'] = String(filters.isTerminating);
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
