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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img
                        src="/images/logo_bw.jpg"
                        alt="CP Logo"
                        style={{ width: '75px', height: '75px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.03em', color: '#000', textTransform: 'uppercase' }}>
                            NEW CAREER POINT
                        </h1>
                        <p style={{ fontSize: '14px', color: '#222', margin: '2px 0 0', fontWeight: 800 }}>
                            Quality Education & Guidance Center
                        </p>
                        <p style={{ fontSize: '12px', color: '#444', margin: '2px 0 0', fontWeight: 700 }}>
                            Vaibhav Complex, Nagpur. | Ph: +91 84469 87338
                        </p>
                        <div style={{ fontSize: '11px', color: '#666', margin: '4px 0 0', display: 'flex', gap: '12px' }}>
                            <span>Reg No: <strong>UDYAM-MH-20-0026811</strong></span>
                            <span>GSTIN: <strong>27ADYPR1897B1ZV</strong></span>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        backgroundColor: '#000',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        marginBottom: '10px'
                    }}>
                        Payment Receipt
                    </div>
                    <div style={{ fontSize: '16px', color: '#000', fontWeight: 900 }}>#{receipt?.receiptNumber}</div>
                    <div style={{ fontSize: '14px', color: '#444', fontWeight: 700 }}>{formattedDate}</div>
                </div>
            </div>

            {/* Information Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
                padding: '16px 0',
                borderTop: '2px solid #000',
                borderBottom: '2px solid #000',
                marginBottom: '16px'
            }}>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#4b5563', display: 'block', marginBottom: '6px' }}>Student Name</label>
                    <p style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#000' }}>{student?.firstName} {student?.lastName}</p>
                    <p style={{ fontSize: '13px', margin: '4px 0 0', color: '#111', fontWeight: 700 }}>ID: {student?.admissionNumber}</p>
                </div>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#4b5563', display: 'block', marginBottom: '6px' }}>Course / Class Info</label>
                    <p style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#000' }}>{className?.replace('Grade', 'Class')}</p>
                    <p style={{ fontSize: '13px', margin: '4px 0 0', color: '#111', fontWeight: 700 }}>Session: {enrollment.academicYear}</p>
                </div>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#4b5563', display: 'block', marginBottom: '6px' }}>Transaction Details</label>
                    <p style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#000' }}>{paymentModeLabel}</p>
                    <p style={{ fontSize: '13px', margin: '4px 0 0', color: '#111', fontWeight: 700 }}>By: {receiverName}</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '20px' }}>
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #333' }}>
                                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#4b5563' }}>Fee Description</th>
                                <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#4b5563' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '12px 0', fontSize: '15px', fontWeight: 700, color: '#000' }}>Academic Tuition Fee</td>
                                <td style={{ padding: '12px 0', fontSize: '16px', fontWeight: 900, textAlign: 'right', color: '#000' }}>{formatCurrency(enrollment.netFee)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '6px', fontStyle: 'italic', fontWeight: 800 }}>Amount in words:</p>
                        <p style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: '#000', textTransform: 'capitalize' }}>Rupees {amountInWords}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#fafafa', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#4b5563' }}>Previous Due:</span>
                            <span style={{ fontWeight: 800, color: '#000' }}>{formatCurrency(balanceBefore)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#4b5563' }}>Paid Amount:</span>
                            <span style={{ fontWeight: 900, color: '#059669', fontSize: '18px' }}>{formatCurrency(amountPaid)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', color: '#dc2626' }}>
                            <span style={{ fontWeight: 900 }}>Remaining Balance:</span>
                            <span style={{ fontWeight: 900, fontSize: '18px' }}>{formatCurrency(balanceAfter)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ borderTop: '2px solid #000', paddingTop: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#000' }}>Parent / Guardian</span>
                    </div>
                </div>

                {/* Received Stamp Mockup */}
                <div style={{
                    width: '70px',
                    height: '70px',
                    border: '3px solid #000',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotate(-15deg)',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 1000,
                    textAlign: 'center',
                    opacity: 0.8
                }}>
                    PAID &<br />VERIFIED
                </div>

                <div style={{ textAlign: 'center', width: '200px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 6px', color: '#000' }}>{receiverName}</p>
                    <div style={{ borderTop: '2px solid #000', paddingTop: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#000' }}>Authorized Signatory</span>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '2px solid #000', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#000', margin: 0, fontWeight: 700 }}>This is a computer-generated document. | © {new Date().getFullYear()} New Career Point</p>
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
