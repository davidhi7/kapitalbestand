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
import { NotificationEvent, NotificationStyle, eventEmitter } from '@/components/Notification.vue';
import { MonthType } from '@/components/input/MonthInput.vue';

export type TransactionFilterRules = {
    Category?: Category;
    Shop?: Shop;
    isExpense?: boolean;
    isMonthlyTransaction: boolean;
    amountFrom?: number;
    amountTo?: number;
    dateFrom?: string;
    dateTo?: string;
    monthFrom?: MonthType;
    monthTo?: MonthType;
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
                monthFrom: { year: currentDate.getFullYear(), month: 1 },
                isMonthlyTransaction: false
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

            // TODO add to currently stored transactions
            // const body = await response.json();
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
                    payload['monthFrom'] = `${filters.monthFrom.year}-${filters.monthFrom.month}`;
                }

                if (filters.monthTo !== undefined) {
                    payload['monthTo'] = `${filters.monthTo.year}-${filters.monthTo.month}`;
                }
            }

            const response = await fetch(endpoint + '?' + new URLSearchParams(payload));

            // TODO debug not working
            if (!response.ok) {
                eventEmitter.dispatchEvent(
                    new NotificationEvent(
                        NotificationStyle.ERROR,
                        'Fehler beim Laden der Transaktionen'
                    )
                );
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

            // TODO add to currently stored transactions
            // const body = await response.json();
            // const transaction_type =
            //     body.data.Transaction.isExpense === true ? 'expenses' : 'incomes';
            // this.transactions[type][transaction_type][body.data.id] = body.data;
        },
        async delete(type: TransactionType, id: number) {
            const endpoint = `/api/transactions/${type}/${id}`;
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }
            // TODO Remove from currently stored transactions
            // if (this.transactions[type]['expenses'][id]) {
            //     delete this.transactions[type]['expenses'][id];
            // } else if (this.transactions[type]['incomes'][id]) {
            //     delete this.transactions[type]['incomes'][id];
            // }
        }
    }
});
