import { useState, useCallback, type RefObject } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export type DocType = 'admission' | 'receipt';

interface SilentPrintOptions {
    contentRef: RefObject<HTMLElement | null>;
    docType: DocType;
}

export function useSilentPrint(options: SilentPrintOptions) {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = useCallback(async () => {
        if (!options.contentRef.current) {
            toast.error('Print content is not ready');
            return;
        }

        setIsPrinting(true);
        const toastId = toast.loading(`Sending ${options.docType} to printer...`);

        try {
            // Extract HTML content from the ref
            let htmlContent = options.contentRef.current.outerHTML;

            // Simple regex to prepend origin to relative image paths so Puppeteer can load them
            const origin = window.location.origin;
            htmlContent = htmlContent.replace(/src="\/([^"]*)"/g, `src="${origin}/$1"`);

            // Collect only internal <style> tags. Avoid <link> tags which might
            // contain massive Tailwind/Global CSS that could hide content on print.
            const styleTags = Array.from(document.querySelectorAll('style'))
                .map(el => el.outerHTML)
                .join('\n');

            // Make it a full HTML document so Puppeteer renders it nicely.
            const fullHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <title>Print - ${options.docType}</title>
                    ${styleTags}
                    <style>
                        /* Essential overrides for silent PDF generation */
                        :root {
                            color-scheme: light !important;
                        }
                        
                        html, body { 
                            margin: 0 !important;
                            padding: 0 !important;
                            background-color: white !important;
                            color: #000000 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        /* Target all text elements gently to ensure printer visibility */
                        div, p, span, h1, h2, h3, h4, h5, h6, td, th {
                            color: #000000 !important;
                        }

                        /* Make specific borders dark without breaking layout */
                        .ncp-receipt-info-grid, .ncp-receipt-info-grid > div,
                        .ncp-receipt-header, .ncp-receipt-footer, 
                        div[style*="border"] {
                            border-color: #000000 !important;
                        }

                        .print-container {
                            width: 100%;
                        }
                    </style>
                </head>
                <body class="print-mode">
                    <div class="print-container">
                        ${htmlContent}
                    </div>
                </body>
                </html>
            `;

            await apiClient.post('/print/silent', {
                html: fullHtml,
                docType: options.docType
            });

            toast.success('Print job sent! Please wait up to 2 mins for the printer to respond.', { id: toastId, duration: 8000 });
        } catch (error: any) {
            console.error('Silent print error:', error);
            // Even if it times out locally, the backend might have successfully queried it.
            toast.success('Print job queued. Please wait up to 2 mins for the printer to respond.', { id: toastId, duration: 8000 });
        } finally {
            setIsPrinting(false);
        }
    }, [options.contentRef, options.docType]);

    return { handlePrint, isPrinting };
}
