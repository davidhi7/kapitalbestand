import { InferAttributes } from 'sequelize';

import type { MonthlyTransactionQueryParameters as FullMonthlyTransactionQueryParameters } from '../controllers/transaction/MonthlyTransactionController.js';
import type { OneoffTransactionQueryParameters as FullOneoffTransactionQueryParameters } from '../controllers/transaction/OneoffTransactionController.js';
import { BaseFetchParameters } from '../controllers/types.js';
import {
    MonthlyTransaction as MonthlyTransactionClass,
    OneoffTransaction as OneoffTransactionClass,
    Transaction as TransactionClass
} from '../database/db.js';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type Transaction = Omit<InferAttributes<TransactionClass>, 'User'>;
type OneoffTransaction = Omit<
    InferAttributes<OneoffTransactionClass>,
    'User' | 'Transaction' | 'date'
> & {
    Transaction: Transaction;
    date: string;
};
type MonthlyTransaction = Omit<
    InferAttributes<MonthlyTransactionClass>,
    'User' | 'Transaction' | 'monthFrom' | 'monthTo'
> & { Transaction: Transaction; monthFrom: string; monthTo?: string };

export type OneoffTransactionQueryParameters = Omit<
    PartialBy<FullOneoffTransactionQueryParameters, keyof BaseFetchParameters>,
    'dateFrom' | 'dateTo'
> & { dateFrom?: string; dateTo?: string };

export type MonthlyTransactionQueryParameters = Omit<
    PartialBy<FullMonthlyTransactionQueryParameters, keyof BaseFetchParameters>,
    'monthFrom' | 'monthTo'
> & { monthFrom?: string; monthTo?: string };

export { MonthlyTransaction, OneoffTransaction, Transaction };
