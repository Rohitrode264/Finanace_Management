/**
 * Convert a number to its word representation in Indian numbering system
 */
export function numberToWords(num: number): string {
    if (num === 0) return 'Zero';

    const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const doubleDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tensDigits = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const formatShort = (n: number): string => {
        let str = '';
        if (n >= 100) {
            str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n >= 10 && n <= 19) {
            str += doubleDigits[n - 10] + ' ';
        } else {
            if (n >= 20) {
                str += tensDigits[Math.floor(n / 10)] + ' ';
                n %= 10;
            }
            if (n > 0) {
                str += singleDigits[n] + ' ';
            }
        }
        return str;
    };

    let result = '';
    const crores = Math.floor(num / 10000000);
    num %= 10000000;
    const lakhs = Math.floor(num / 100000);
    num %= 100000;
    const thousands = Math.floor(num / 1000);
    num %= 1000;

    if (crores > 0) result += formatShort(crores) + 'Crore ';
    if (lakhs > 0) result += formatShort(lakhs) + 'Lakh ';
    if (thousands > 0) result += formatShort(thousands) + 'Thousand ';
    if (num > 0) result += formatShort(num);

    return result.trim() + ' Only';
}
