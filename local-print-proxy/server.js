const express = require('express');
const cors = require('cors');
const { print, getDefaultPrinter } = require('pdf-to-printer');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();

// Allow frontend to communicate from the web
app.use(cors());

// Accept raw PDF binary data
app.use(express.raw({ type: 'application/pdf', limit: '50mb' }));

app.post('/print', async (req, res) => {
    try {
        const pdfBuffer = req.body;
        if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
            return res.status(400).json({ error: 'Valid PDF Buffer required' });
        }

        const tmpPath = path.join(os.tmpdir(), `receipt_${Date.now()}.pdf`);
        fs.writeFileSync(tmpPath, pdfBuffer);

        const defaultPrinter = await getDefaultPrinter();
        console.log(`Printing to default device: ${defaultPrinter?.name || 'Local Printer'}`);

        // Queue to spooler safely
        print(tmpPath, { silent: true })
            .then(() => console.log(`✓ Job verified in spool queue (${tmpPath})`))
            .catch((err) => console.error('x Print failed:', err))
            .finally(() => {
                setTimeout(() => {
                    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
                }, 10000); // 10 second safety timer
            });

        // Respond to frontend instantly! No timeouts.
        res.status(200).json({ 
            success: true, 
            message: 'Queued to local hardware spooler' 
        });

    } catch (err) {
        console.error('Fatal Print Proxy Error:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🖨️  Local Print Proxy Running on Port ${PORT}`);
    console.log(`📡 Ready to receive silent print jobs`);
    console.log(`=========================================`);
});
