import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import { numberToWords } from '../../utils/numberToWords';
import type { Receipt, Payment, Enrollment, Student, AcademicClass, ClassTemplate } from '../../types';

interface ProfessionalReceiptProps {
    receipt: Receipt;
    payment: Payment;
    enrollment: Enrollment;
    student: Student;
    academicClass: AcademicClass;
}

export function ProfessionalReceipt({ receipt, payment, enrollment, student, academicClass }: ProfessionalReceiptProps) {
    // Calculations
    const amountPaid = payment.amount;
    const balanceAfter = enrollment.outstandingBalance ?? 0;
    const balanceBefore = balanceAfter + amountPaid;

    const template = typeof academicClass?.templateId === 'object' ? academicClass.templateId as ClassTemplate : null;
    const className = template ? `${template.grade}${template.stream ? ` (${template.stream})` : ''} - ${template.board}` : 'N/A';

    const formattedDate = receipt?.createdAt ? format(new Date(receipt.createdAt), 'dd MMMM yyyy') : 'N/A';
    const amountInWords = numberToWords(amountPaid);

    // Receiver name from populated payment object
    const receivedByObj = (payment as any)?.receivedBy;
    const receiverName =
        typeof receivedByObj === 'object'
            ? (receivedByObj?.name || (receivedByObj?.firstName ? `${receivedByObj.firstName} ${receivedByObj.lastName || ''}`.trim() : null))
            : (typeof receivedByObj === 'string' ? receivedByObj : null) || 'Authorized Collector';

    const paymentModeLabels: Record<string, string> = {
        CASH: '💷 Cash',
        UPI: '📱 UPI / Online',
        CARD: '💳 Card',
        CHEQUE: '🧾 Cheque',
        BANK_TRANSFER: '🏦 Bank Transfer',
    };
    const paymentModeLabel = paymentModeLabels[payment.paymentMode] || payment.paymentMode;

    return (
        <div className="receipt-premium-container" style={{
            width: '100%',
            maxWidth: '210mm', // A5 landscape width
            minHeight: '145mm', // Safer margin for A5
            padding: '10px 20px', // Reduced top padding to move content up
            margin: '0 auto',
            backgroundColor: '#ffffff',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            color: '#1a1a1a',
            position: 'relative',
            border: '2px solid #000',
            boxSizing: 'border-box'
        }}>
            {/* Branding Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                        src="/images/logo_bw.jpg"
                        alt="CP Logo"
                        style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.02em', color: '#000', textTransform: 'uppercase' }}>
                            NEW CAREER POINT
                        </h1>
                        <p style={{ fontSize: '11px', color: '#444', margin: '2px 0 0', fontWeight: 600 }}>
                            Quality Education & Guidance Center
                        </p>
                        <p style={{ fontSize: '10px', color: '#666', margin: '1px 0 0' }}>
                            Vaibhav Complex, Nagpur. | Ph: +91 84469 87338
                        </p>
                        <div style={{ fontSize: '9px', color: '#888', margin: '2px 0 0', display: 'flex', gap: '8px' }}>
                            <span>Reg No: <strong>UDYAM-MH-20-0026811</strong></span>
                            <span>GSTIN: <strong>27ADYPR1897B1ZV</strong></span>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: '#000',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        marginBottom: '8px'
                    }}>
                        Payment Receipt
                    </div>
                    <div style={{ fontSize: '12px', color: '#000', fontWeight: 700 }}>#{receipt?.receiptNumber}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{formattedDate}</div>
                </div>
            </div>

            {/* Information Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                padding: '12px 0',
                borderTop: '1px solid #000',
                borderBottom: '1px solid #000',
                marginBottom: '12px'
            }}>
                <div>
                    <label style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Student</label>
                    <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>{student?.firstName} {student?.lastName}</p>
                    <p style={{ fontSize: '11px', margin: '2px 0 0', color: '#4b5563' }}>ID: {student?.admissionNumber}</p>
                </div>
                <div>
                    <label style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Course / Year</label>
                    <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{className?.replace('Grade', 'Class')}</p>
                    <p style={{ fontSize: '11px', margin: '2px 0 0', color: '#4b5563' }}>Session: {enrollment.academicYear}</p>
                </div>
                <div>
                    <label style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Transaction</label>
                    <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{paymentModeLabel}</p>
                    <p style={{ fontSize: '11px', margin: '2px 0 0', color: '#4b5563' }}>By: {receiverName}</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '12px' }}>
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af' }}>Fee Description</th>
                                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '10px 0', fontSize: '12px' }}>Academic Tuition Fee</td>
                                <td style={{ padding: '10px 0', fontSize: '12px', textAlign: 'right' }}>{formatCurrency(enrollment.netFee)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style={{ marginTop: '12px', padding: '10px', background: '#f9fafb', borderRadius: '6px' }}>
                        <p style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontStyle: 'italic' }}>Amount in words:</p>
                        <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>Rupees {amountInWords}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: '#faf9f6', borderRadius: '8px', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Previous Balance Due:</span>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(balanceBefore)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Amount Paid Now:</span>
                            <span style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(amountPaid)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '4px', color: '#ef4444', fontWeight: 800 }}>
                            <span>Remaining Balance:</span>
                            <span>{formatCurrency(balanceAfter)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '15px' }}>
                <div style={{ textAlign: 'center', width: '160px' }}>
                    <div style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>Parent / Guardian</span>
                    </div>
                </div>

                {/* Received Stamp Mockup */}
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '2px solid rgba(0,0,0,0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotate(-10deg)',
                    color: 'rgba(0,0,0,0.15)',
                    fontSize: '9px',
                    fontWeight: 900,
                    textAlign: 'center'
                }}>
                    PAID &<br />VERIFIED
                </div>

                <div style={{ textAlign: 'center', width: '160px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 800, margin: '0 0 4px' }}>{receiverName}</p>
                    <div style={{ borderTop: '2px solid #000', paddingTop: '6px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>Authorized Signatory</span>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                <p style={{ fontSize: '9px', color: '#9ca3af', margin: 0 }}>This is a computer-generated document. | © {new Date().getFullYear()} New Career Point</p>
            </div>

            <style>{`
                @media print {
                    .receipt-premium-container {
                        border: 1px solid #000 !important;
                        padding: 24px 32px !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 210mm !important;
                        min-height: 145mm !important;
                        box-shadow: none !important;
                    }
                    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    @page { 
                        size: A5 landscape; 
                        margin: 0; 
                    }
                }
            `}</style>
        </div>
    );
}
