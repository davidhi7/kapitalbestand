import { format_currency, format_year_month } from '@/common';
import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

export const breakpoints = ['', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
export type Breakpoint = typeof breakpoints[number];

export interface ColumnSettings<T extends OneoffTransaction | MonthlyTransaction> {
    title: string;
    extractor: (transaction: T) => string;
    breakpoint: Breakpoint;
}

const genericCategories: ColumnSettings<OneoffTransaction | MonthlyTransaction>[] = [
    {
        title: 'Kategorie',
        extractor: (transaction) => {
            return String(transaction.Transaction.Category.name);
        },
        breakpoint: ''
    },
    {
        title: 'Händler',
        extractor: (transaction) => {
            if (transaction.Transaction.Shop) {
                return String(transaction.Transaction.Shop.name);
            }
            return '';
        },
        breakpoint: 'sm'
    },
    {
        title: 'Betrag',
        extractor: (transaction) => {
            return format_currency(transaction.Transaction.amount);
        },
        breakpoint: ''
    },
    {
        title: 'Beschreibung',
        extractor: (transaction) => transaction.Transaction.description,
        breakpoint: 'xl'
    }
];

export const oneoffTransactionColumnSettings: ColumnSettings<OneoffTransaction>[] = [
    {
        title: 'Datum',
        extractor: (transaction) => {
            return new Date(transaction.date).toLocaleDateString();
        },
        breakpoint: ''
    },
    ...(genericCategories as ColumnSettings<OneoffTransaction>[])
];

export const monthlyTransactionColumnSettings: ColumnSettings<MonthlyTransaction>[] = [
    {
        title: 'Zeitraum',
        extractor: (transaction) => {
            const [yearFrom, monthFrom] = transaction.monthFrom.split('-').map(Number);
            if (!transaction.monthTo) {
                return `Ab ${format_year_month({
                    date: new Date(yearFrom, monthFrom),
                    style: 'short'
                })}`;
            }

            const [yearTo, monthTo] = transaction.monthTo.split('-').map(Number);
            return `${format_year_month({
                date: new Date(yearFrom, monthFrom),
                style: 'short'
            })} bis ${format_year_month({
                date: new Date(yearTo, monthTo),
                style: 'short'
            })}`;
        },
        breakpoint: ''
    },
    ...(genericCategories as ColumnSettings<MonthlyTransaction>[])
];
