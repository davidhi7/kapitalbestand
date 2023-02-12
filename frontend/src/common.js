const currency_format = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

/**
 * Apply number format to amounts of money
 * @param {*} value Integer amount of money in cents
 * @returns Formatted string
 */
export function format_currency(value) {
    return currency_format.format(value / 100);
}

/**
 * Return a date in 'YYYY-MM' format.
 * @param {*} date 
 * @returns 
 */
export function format_month(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
}
