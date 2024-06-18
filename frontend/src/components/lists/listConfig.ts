import { MonthlyTransaction, OneoffTransaction } from '@backend-types/TransactionTypes';

import { formatCurrency, formatYearMonth, shortDateFormat } from '@/common';

export const breakpoints = ['', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
export type Breakpoint = (typeof breakpoints)[number];
export type NotEmptyBreakpoint = Exclude<Breakpoint, ''>;

export function dateFormatter(transaction: OneoffTransaction) {
    return shortDateFormat.format(new Date(transaction.date));
}

export function monthSpanFormatter(transaction: MonthlyTransaction, format: 'long' | 'short') {
    const [yearFrom, monthFrom] = transaction.monthFrom.split('-').map(Number);
    if (!transaction.monthTo) {
        return `Ab ${formatYearMonth({
            date: new Date(yearFrom, monthFrom),
            style: format
        })}`;
    }

    const [yearTo, monthTo] = transaction.monthTo.split('-').map(Number);
    return `${formatYearMonth({
        date: new Date(yearFrom, monthFrom),
        style: format
    })}${format === 'short' ? ' - ' : ' bis '}${formatYearMonth({
        date: new Date(yearTo, monthTo),
        style: format
    })}`;
}

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
            return formatCurrency(transaction.Transaction.amount);
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
        extractor: dateFormatter,
        breakpoint: ''
    },
    ...(genericCategories as ColumnSettings<OneoffTransaction>[])
];

export const monthlyTransactionColumnSettings: ColumnSettings<MonthlyTransaction>[] = [
    {
        title: 'Zeitraum',
        extractor: (transaction) => {
            return monthSpanFormatter(transaction, 'short');
        },
        breakpoint: ''
    },
    ...(genericCategories as ColumnSettings<MonthlyTransaction>[])
];
