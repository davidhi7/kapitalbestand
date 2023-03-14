const currency_format = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const year_month_format_long = new Intl.DateTimeFormat('de-DE', { year: 'numeric', month: 'long' });
const year_month_format_short = new Intl.DateTimeFormat('de-DE', { year: 'numeric', month: 'short' });


/**
 * Apply number format to amounts of money
 * @param {*} value Integer amount of money in cents
 * @returns Formatted string
 */
export function format_currency(value) {
    return currency_format.format(value / 100);
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
export function format_year_month({ date, style }) {
    if (style === 'long') {
        return year_month_format_long.format(date);
    } else if (style === 'short') {
        return year_month_format_short.format(date);
    } else if (style === 'iso') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
}
