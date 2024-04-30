export const shortDateFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

const currencyFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const longYearMonthFormat = new Intl.DateTimeFormat('de-DE', { year: 'numeric', month: 'long' });
const shortYearMonthFormat = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit'
});

/**
 * Apply number format to amounts of money
 * @param {*} value Integer amount of money in cents
 * @returns Formatted string
 */
export function formatCurrency(value: number): string {
    return currencyFormat.format(Number(value) / 100);
}

/**
 * Return a date in one of the following formats:
 * if `style` is 'long': {long month} {year}
 * if `style` is 'short': {short month} {year}
 * if `style` is 'iso': {year}-{2-digit month}
 * @param {*} date
 * @param {*} style: either 'long', 'short' or 'iso'.
 * @returns
 */
export function formatYearMonth(attributes: {
    date: Date;
    style: 'long' | 'short' | 'iso';
}): string {
    if (attributes.style === 'long') {
        return longYearMonthFormat.format(attributes.date);
    } else if (attributes.style === 'short') {
        return shortYearMonthFormat.format(attributes.date);
    } else if (attributes.style === 'iso') {
        return `${attributes.date.getFullYear()}-${String(attributes.date.getMonth() + 1).padStart(2, '0')}`;
    } else {
        throw Error('Invalid value for attribute `style`: ' + String(attributes.style));
    }
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
