export const shortDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});
export const longDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
});
export const shortDateTimeFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
});
export const longYearMonthFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long'
});
export const shortYearMonthFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit'
});

const currencyFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

/**
 * Apply number format to amounts of money
 * @param {*} value Integer amount of money in cents
 * @returns Formatted string
 */
export function formatCurrency(value: number): string {
    return currencyFormat.format(Number(value) / 100);
}

/**
 * Remove diacritics, e.g. turn 'Döner' into 'Doner'
 */
export function normalizeStrings(input: string) {
    return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Format date as `YYYY-MM` string
 */
export function dateToYearMonth(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format date as `YYYY-MM-DD` string
 */
export function dateToIsoDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
