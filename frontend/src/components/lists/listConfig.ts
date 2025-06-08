import {
    formatCurrency,
    longDateFormat,
    longYearMonthFormat,
    shortDateFormat,
    shortYearMonthFormat
} from '@/common';
import { MonthlyTransaction, OneoffTransaction } from '@/stores/TransactionStore';

export const breakpoints = ['', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
export type Breakpoint = (typeof breakpoints)[number];
export type NotEmptyBreakpoint = Exclude<Breakpoint, ''>;

export function formatMonthRange(transaction: MonthlyTransaction, format: 'long' | 'short') {
    const yearMonthFormat = format === 'long' ? longYearMonthFormat : shortYearMonthFormat;

    if (!transaction.monthTo) {
        return `Ab ${yearMonthFormat.format(new Date(transaction.monthFrom))}`;
    }

    return yearMonthFormat.formatRange(
        new Date(transaction.monthFrom),
        new Date(transaction.monthTo)
    );
}

export interface ColumnSettings<T extends OneoffTransaction | MonthlyTransaction> {
    title: string;
    text_function: (instance: T, style: 'long' | 'short') => string;
    style_function?: (instance: T) => string;
    breakpoint: Breakpoint;
}

const genericCategories: ColumnSettings<OneoffTransaction | MonthlyTransaction>[] = [
    {
        title: 'Kategorie',
        text_function: (transaction, style) => transaction.category ?? '',
        breakpoint: ''
    },
    {
        title: 'Händler',
        text_function: (transaction, style) => transaction.shop ?? '',
        breakpoint: 'sm'
    },
    {
        title: 'Betrag',
        text_function: (transaction, style) => {
            const prefix = transaction.isExpense ? '' : '+';
            return prefix + formatCurrency(transaction.amount);
        },
        style_function: (transaction) => {
            if (!transaction.isExpense) return 'text-positive font-semibold';
            return 'font-semibold';
        },
        breakpoint: ''
    },
    {
        title: 'Beschreibung',
        text_function: (transaction, style) => transaction.description ?? '-',
        breakpoint: 'xl'
    }
];

export const oneoffTransactionColumnSettings: ColumnSettings<OneoffTransaction>[] = [
    {
        title: 'Datum',
        text_function: (transaction, style) => {
            if (style === 'short') return shortDateFormat.format(new Date(transaction.date));
            else return longDateFormat.format(new Date(transaction.date));
        },
        breakpoint: ''
    },
    ...genericCategories
];

export const monthlyTransactionColumnSettings: ColumnSettings<MonthlyTransaction>[] = [
    {
        title: 'Zeitraum',
        text_function: (transaction, style) => {
            return formatMonthRange(transaction, style);
        },
        breakpoint: ''
    },
    ...genericCategories
];
