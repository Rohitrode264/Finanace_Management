import express, { Request, Response } from 'express';
import cors from 'cors';
import { print, getDefaultPrinter } from 'pdf-to-printer';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const app = express();

// Allow frontend to communicate from the web
app.use(cors());

// Accept raw PDF binary data
app.use(express.raw({ type: 'application/pdf', limit: '50mb' }));

app.post('/print', async (req: Request, res: Response): Promise<void> => {
    try {
        const pdfBuffer = req.body;
        
        if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
            res.status(400).json({ error: 'Valid PDF Buffer required' });
            return;
        }

        const tmpPath = path.join(os.tmpdir(), `receipt_${Date.now()}.pdf`);
        fs.writeFileSync(tmpPath, pdfBuffer);

        try {
            const defaultPrinter = await getDefaultPrinter();
            console.log(`Printing to default device: ${defaultPrinter?.name || 'Local Printer'}`);
        } catch (e) {
            console.log(`Could not fetch default printer name, proceeding to queue anyway.`);
        }

        // Queue to spooler safely
        print(tmpPath, { silent: true })
            .then(() => console.log(`✓ Job verified in spool queue (${tmpPath})`))
            .catch((err: Error) => console.error('x Print failed:', err))
            .finally(() => {
                setTimeout(() => {
                    if (fs.existsSync(tmpPath)) {
                        fs.unlinkSync(tmpPath);
                    }
                }, 10000); // 10 second safety timer
            });

        // Respond to frontend instantly! No timeouts.
        res.status(200).json({ 
            success: true, 
            message: 'Queued to local hardware spooler' 
        });

    } catch (err: unknown) {
        console.error('Fatal Print Proxy Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🖨️  Local Print Proxy Running on Port ${PORT}`);
    console.log(`📡 Ready to receive silent print jobs`);
    console.log(`=========================================`);
});
