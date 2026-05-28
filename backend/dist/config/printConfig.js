"use strict";
/**
 * Centralised per-document print configuration.
 *
 * Each entry maps a docType string to the Puppeteer PDF options that should
 * be used when generating that document type.  Adding a new document type
 * only requires adding a new key here — no other code needs to change.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRINT_CONFIG = void 0;
exports.PRINT_CONFIG = {
    /**
     * Admission Form
     * A4 portrait, full scale, no margins (the component handles its own padding)
     */
    admission: {
        label: 'Admission Form',
        pdf: {
            format: 'A4',
            scale: 1,
            printBackground: true,
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0.8in',
            },
        },
    },
    /**
     * Payment Receipt
     * A5 portrait (148 × 210 mm), scale 0.99, custom bottom margin to
     * match the physical receipt paper loaded in the printer.
     * Left/right/top are zero so the receipt design bleeds to the edge.
     * Bottom 3.4 in ≈ 86 mm — prevents the footer from being cut off.
     */
    receipt: {
        label: 'Payment Receipt',
        pdf: {
            format: 'A5',
            scale: 0.99,
            printBackground: true,
            margin: {
                top: '0',
                right: '0',
                bottom: '3.42in',
                left: '0',
            },
        },
    },
};
//# sourceMappingURL=printConfig.js.map