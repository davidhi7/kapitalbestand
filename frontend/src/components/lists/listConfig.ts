import {
    formatCurrency,
    longDateFormat,
    longYearMonthFormat,
    shortDateFormat,
    shortYearMonthFormat
} from '@/common';
import {
    OneoffTransaction,
    Recurrence,
    RecurringTransaction
} from '@/stores/TransactionStore';

export const breakpoints = ['', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
export type Breakpoint = (typeof breakpoints)[number];
export type NotEmptyBreakpoint = Exclude<Breakpoint, ''>;

export function formatRecurrenceRange(recurrence: Recurrence, format: 'long' | 'short') {
    const yearMonthFormat = format === 'long' ? longYearMonthFormat : shortYearMonthFormat;

    if (recurrence.frequency === 'monthly') {
        if (!recurrence.monthTo) {
            return `Ab ${yearMonthFormat.format(new Date(recurrence.monthFrom))}`;
        }
        return yearMonthFormat.formatRange(
            new Date(recurrence.monthFrom),
            new Date(recurrence.monthTo)
        );
    } else {
        if (!recurrence.yearTo) {
            return `Ab ${recurrence.yearFrom}`;
        }
        return `${recurrence.yearFrom} – ${recurrence.yearTo}`;
    }
}

export interface ColumnSettings<T extends OneoffTransaction | RecurringTransaction> {
    title: string;
    text_function: (instance: T, style: 'long' | 'short') => string;
    style_function?: (instance: T) => string;
    breakpoint: Breakpoint;
}

const genericCategories: ColumnSettings<OneoffTransaction | RecurringTransaction>[] = [
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

export const recurringTransactionColumnSettings: ColumnSettings<RecurringTransaction>[] = [
    {
        title: 'Zeitraum',
        text_function: (transaction, style) => {
            return formatRecurrenceRange(transaction.recurrence, style);
        },
        breakpoint: ''
    },
    ...genericCategories
];
