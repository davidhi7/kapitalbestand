import { defineStore } from 'pinia';

import HttpError from '@/HttpError';
import { dateToIsoDate, dateToYearMonth } from '@/common';
import type {
    TransactionFilterRules,
    TransactionOrderRules
} from '@/components/pages/ListPage.vue';

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
} & TransactionOrderRules;

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

export type UpdateParams<T extends TransactionType> =
    BaseTransactionUpdateParams & T extends 'oneoff'
        ? OneoffTransactionUpdateParams
        : RecurringTransactionUpdateParams;

export function isOneoffTransaction(
    transaction: OneoffTransaction | RecurringTransaction
): transaction is OneoffTransaction {
    return (transaction as OneoffTransaction).date != undefined;
}

// This used to hold actual state but no more
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface State {}

export const useTransactionStore = defineStore('Transaction', {
    state: (): State => {
        return {};
    },
    actions: {
        async create<T extends TransactionType>(
            type: T,
            payload: CreateParams<T>
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
        },
        async fetch(
            filters: TransactionFilterRules,
            order: TransactionOrderRules
        ): Promise<{
            oneoff: OneoffTransaction[];
            recurring: RecurringTransaction[];
        }> {
            const fetchOneoff =
                filters.recurrence === 'all' || filters.recurrence === 'oneoff';
            const fetchRecurring =
                filters.recurrence === 'all' ||
                filters.recurrence === 'recurring';

            const baseParams: Record<string, string> = {
                ordering: order.ordering,
                orderKey: order.orderKey
            };
            if (filters.type === 'expense') baseParams.isExpense = 'true';
            if (filters.type === 'income') baseParams.isExpense = 'false';
            if (filters.amountFrom != null)
                baseParams.amountFrom = String(filters.amountFrom);
            if (filters.amountTo != null)
                baseParams.amountTo = String(filters.amountTo);

            const oneoffPromise = fetchOneoff
                ? (async (): Promise<OneoffTransaction[]> => {
                      const params = new URLSearchParams(baseParams);
                      if (filters.dateFrom)
                          params.set(
                              'dateFrom',
                              dateToIsoDate(filters.dateFrom)
                          );
                      if (filters.dateTo)
                          params.set('dateTo', dateToIsoDate(filters.dateTo));
                      const r = await fetch(
                          `/api/transactions/oneoff?${params}`
                      );
                      if (!r.ok) throw new HttpError(r.status);
                      return await (
                          await r.json()
                      ).data;
                  })()
                : Promise.resolve([] as OneoffTransaction[]);

            const recurringPromise = fetchRecurring
                ? (async (): Promise<RecurringTransaction[]> => {
                      const params = new URLSearchParams(baseParams);
                      if (filters.dateFrom)
                          params.set(
                              'intervalStartsLe',
                              dateToYearMonth(filters.dateFrom)
                          );
                      if (filters.dateTo)
                          params.set(
                              'intervalEndsGe',
                              dateToYearMonth(filters.dateTo)
                          );
                      const r = await fetch(
                          `/api/transactions/recurring?${params}`
                      );
                      if (!r.ok) throw new HttpError(r.status);
                      return await (
                          await r.json()
                      ).data;
                  })()
                : Promise.resolve([] as RecurringTransaction[]);

            const [oneoff, recurring] = await Promise.all([
                oneoffPromise,
                recurringPromise
            ]);

            return { oneoff, recurring };
        },
        async update<T extends TransactionType>(
            type: T,
            id: number,
            payload: UpdateParams<T>
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
        },
        async delete(type: TransactionType, id: number) {
            const endpoint = `/api/transactions/${type}/${id}`;
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new HttpError(response.status);
            }
        }
    }
});
