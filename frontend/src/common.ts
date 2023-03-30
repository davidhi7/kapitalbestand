const currency_format = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const year_month_format_long = new Intl.DateTimeFormat('de-DE', { year: 'numeric', month: 'long' });
const year_month_format_short = new Intl.DateTimeFormat('de-DE', { year: 'numeric', month: 'short' });

/**
 * Apply number format to amounts of money
 * @param {*} value Integer amount of money in cents
 * @returns Formatted string
 */
export function format_currency(value: number | string): string {
    return currency_format.format(Number(value) / 100);
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
export function format_year_month(attributes: { date: Date; style: 'long' | 'short' | 'iso' }): string {
    if (attributes.style === 'long') {
        return year_month_format_long.format(attributes.date);
    } else if (attributes.style === 'short') {
        return year_month_format_short.format(attributes.date);
    } else if (attributes.style === 'iso') {
        return `${attributes.date.getFullYear()}-${String(attributes.date.getMonth() + 1).padStart(2, '0')}`;
    } else {
        throw Error('Invalid value for attribute `style`: ' + String(attributes.style));
    }
}
