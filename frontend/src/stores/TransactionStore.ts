import { defineStore } from 'pinia';

import { Category, Shop } from '@backend-types/CategoryShopTypes';
import {
    MonthlyTransaction,
    MonthlyTransactionCreateParameters,
    MonthlyTransactionQueryParameters,
    OneoffTransaction,
    OneoffTransactionCreateParameters,
    OneoffTransactionQueryParameters
} from '@backend-types/TransactionTypes';

import HttpError from '@/HttpError';
import { dateToIsoDate } from '@/common';

export type TransactionFilterRules = {
    Category?: Category;
    Shop?: Shop;
    isExpense?: boolean;
    isMonthlyTransaction: boolean;
    amountFrom?: number;
    amountTo?: number;
    dateFrom?: string;
    dateTo?: string;
    monthFrom?: string;
    monthTo?: string;
    order: {
        key: 'Category' | 'Shop' | 'amount' | 'time';
        order: 'ASC' | 'DESC';
    };
};

export type TransactionType = 'oneoff' | 'monthly';

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
                    key: 'time',
                    order: 'ASC'
                }
            },
            transactions: []
        };
    },
    actions: {
        async create<T extends TransactionType>(
            type: T,
            payload: T extends 'oneoff'
                ? OneoffTransactionCreateParameters
                : MonthlyTransactionCreateParameters
        ) {
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
                (payload as OneoffTransactionCreateParameters).date == undefined;
            if (isMonthlyTransaction === this.transactionFilterRules.isMonthlyTransaction) {
                this.fetch();
            }
        },
        async fetch() {
            const payload: {
                [key in keyof (OneoffTransactionQueryParameters &
                    MonthlyTransactionQueryParameters)]: string;
            } = {};
            const filters = this.transactionFilterRules;
            let endpoint: string;

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
                payload['CategoryId'] = String(filters.Category.id);
            }

            if (filters.Shop !== undefined) {
                payload['ShopId'] = String(filters.Shop.id);
            }

            if (filters.order) {
                payload['orderKey'] = filters.order.key;
                payload['order'] = filters.order.order;
            }

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

            const response = await fetch(endpoint + '?' + new URLSearchParams(payload));

            if (!response.ok) {
                throw new HttpError(response.status);
            }

            this.transactions = (await response.json()).data;
            return this.transactions;
        },
        async update<T extends TransactionType>(
            type: T,
            id: number,
            payload: T extends 'oneoff'
                ? OneoffTransactionCreateParameters
                : MonthlyTransactionCreateParameters
        ) {
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
