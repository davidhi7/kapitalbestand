import { InferAttributes } from 'sequelize';

import {
    MonthlyTransaction as MonthlyTransactionClass,
    OneoffTransaction as OneoffTransactionClass,
    Transaction as TransactionClass
} from '../database/db.js';

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

export { Transaction, OneoffTransaction, MonthlyTransaction };
