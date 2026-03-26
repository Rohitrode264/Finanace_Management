/**
 * Format a number as Indian Rupees
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format a number compactly (e.g. 1,20,000 → ₹1.2L)
 */
export function formatCurrencyCompact(amount: number): string {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
    if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
    if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
    return formatCurrency(amount);
}

/**
 * Parse a currency string back to a number
 */
export function parseCurrency(value: string): number {
    return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
}
