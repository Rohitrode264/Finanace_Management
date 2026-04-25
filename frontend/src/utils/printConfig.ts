/**
 * Centralized print configuration for all document types.
 * 
 * These pageStyle strings are injected by react-to-print into an isolated
 * print iframe, so they NEVER interfere with each other — unlike inline
 * <style> tags which all live in the same SPA document.
 */

/** Payment Receipt: A5, scale 99%, custom bottom margin */
export const RECEIPT_PAGE_STYLE = `
  @page {
    size: A5 portrait !important;
    margin: 0in 0in 3.42in 0in !important;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    zoom: 0.99 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
`;

/** Admission Form: A4, scale 100%, no margins */
export const ADMISSION_PAGE_STYLE = `
  @page {
    size: A4 portrait !important;
    margin: 0 !important;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    zoom: 1.0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
`;
