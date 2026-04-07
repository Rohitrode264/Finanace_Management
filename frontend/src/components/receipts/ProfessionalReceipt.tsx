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

const INST = {
    name: 'NEW CAREER POINT',
    subtitle: 'Quality Education & Guidance Center',
    address: 'Vaibhav Complex, Nagpur, Maharashtra',
    phone: '+91 84469 87338',
    regNo: 'UDYAM-MH-20-0026811',
    gstin: '27ADYPR1897B1ZV',
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
    CASH: 'Cash',
    UPI: 'UPI / Online Transfer',
    CARD: 'Debit / Credit Card',
    CHEQUE: 'Cheque',
    BANK_TRANSFER: 'Bank Transfer',
};

/* ─── Tiny reusable sub-components ─────────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#6b7280', marginBottom: 3,
        }}>
            {children}
        </div>
    );
}

function FieldValue({ children, size = 14, bold = 700 as number, color = '#111827' }:
    { children: React.ReactNode; size?: number; bold?: number; color?: string }) {
    return (
        <div style={{ fontSize: size, fontWeight: bold, color, lineHeight: 1.3 }}>
            {children}
        </div>
    );
}

function Divider({ style }: { style?: React.CSSProperties }) {
    return <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0', ...style }} />;
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export function ProfessionalReceipt({ receipt, payment, enrollment, student, academicClass }: ProfessionalReceiptProps) {
    const amountPaid = payment.amount;
    const balanceAfter = enrollment.outstandingBalance ?? 0;
    const balanceBefore = balanceAfter + amountPaid;

    const template = typeof academicClass?.templateId === 'object' ? academicClass.templateId as ClassTemplate : null;
    const className = template
        ? `${template.grade}${template.stream ? ` (${template.stream})` : ''} — ${template.board}`
        : 'N/A';

    const formattedDate = receipt?.createdAt ? format(new Date(receipt.createdAt), 'dd MMM yyyy') : 'N/A';
    const formattedTime = receipt?.createdAt ? format(new Date(receipt.createdAt), 'hh:mm a') : '';
    const amountInWords = numberToWords(amountPaid);

    const receivedByObj = (payment as any)?.receivedBy;
    const receiverName =
        typeof receivedByObj === 'object'
            ? (receivedByObj?.name || (receivedByObj?.firstName ? `${receivedByObj.firstName} ${receivedByObj.lastName || ''}`.trim() : null))
            : (typeof receivedByObj === 'string' ? receivedByObj : null) || 'Authorized Staff';

    const paymentModeLabel = PAYMENT_MODE_LABELS[payment.paymentMode] || payment.paymentMode;
    const isPaid = balanceAfter <= 0;

    return (
        <>
            {/* ── Screen + Print stylesheet ───────────────────────────────── */}
            <style>{`
                .ncp-receipt {
                    width: 100%;
                    max-width: 720px;
                    margin: 0 auto;
                    background: #ffffff;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    color: #111827;
                    box-sizing: border-box;
                }

                /* ── Mobile responsiveness ── */
                @media (max-width: 640px) {
                    .ncp-receipt {
                        padding: 16px 12px !important;
                    }
                    .ncp-receipt-header {
                        flex-direction: column !important;
                        gap: 20px !important;
                    }
                    .ncp-receipt-header-meta {
                        text-align: left !important;
                        width: 100% !important;
                    }
                    .ncp-receipt-info-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .ncp-receipt-summary-grid {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                    }
                    .ncp-receipt-footer {
                        flex-direction: column !important;
                        align-items: center !important;
                        gap: 32px !important;
                    }
                    .ncp-receipt-footer > div {
                        width: 100% !important;
                    }
                    .ncp-info-badge {
                        display: block !important;
                        margin-bottom: 8px !important;
                    }
                }

                /* ── Print rules ── */
                @media print {
                    body > * { display: none !important; }
                    .ncp-receipt-print-wrapper { display: block !important; }

                    .ncp-receipt {
                        max-width: 100% !important;
                        padding: 8mm 12mm !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }
                }
            `}</style>

            <div className="ncp-receipt">

                {/* ═══════════════════════  HEADER  ══════════════════════════ */}
                <div className="ncp-receipt-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    paddingBottom: 16,
                    borderBottom: '2px solid #111827',
                }}>
                    {/* Left — branding */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img
                            src="/images/logo_bw.jpg"
                            alt="Logo"
                            style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 6 }}
                        />
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', lineHeight: 1 }}>
                                {INST.name}
                            </div>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', marginTop: 3 }}>
                                {INST.subtitle}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#6b7280', marginTop: 3 }}>
                                {INST.address} &nbsp;|&nbsp; {INST.phone}
                            </div>
                            <div style={{ fontSize: 9.5, color: '#9ca3af', marginTop: 2, display: 'flex', gap: 12 }}>
                                <span>Reg. No: <strong style={{ color: '#6b7280' }}>{INST.regNo}</strong></span>
                                <span>GSTIN: <strong style={{ color: '#6b7280' }}>{INST.gstin}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Right — receipt meta */}
                    <div className="ncp-receipt-header-meta" style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="ncp-info-badge" style={{
                            display: 'inline-block',
                            border: '1.5px solid #111827',
                            borderRadius: 4,
                            padding: '3px 12px',
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: '#111827',
                            marginBottom: 8,
                        }}>
                            Payment Receipt
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
                            #{receipt?.receiptNumber}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#374151', fontWeight: 600, marginTop: 2 }}>
                            {formattedDate}
                        </div>
                        {formattedTime && (
                            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                                {formattedTime}
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════  STUDENT / COURSE / TRANSACTION  ═══════════ */}
                <div className="ncp-receipt-info-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 0,
                    margin: '16px 0',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    overflow: 'hidden',
                }}>
                    {/* Student */}
                    <div style={{ padding: '14px 16px', background: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
                        <FieldLabel>Student</FieldLabel>
                        <FieldValue size={15} bold={800}>
                            {student?.firstName} {student?.lastName}
                        </FieldValue>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3, fontWeight: 500 }}>
                            ID: {student?.admissionNumber}
                        </div>
                    </div>

                    {/* Course */}
                    <div style={{ padding: '14px 16px', background: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
                        <FieldLabel>Course / Class</FieldLabel>
                        <FieldValue size={14} bold={700}>
                            {className}
                        </FieldValue>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3, fontWeight: 500 }}>
                            Session: {enrollment.academicYear}
                        </div>
                    </div>

                    {/* Transaction */}
                    <div style={{ padding: '14px 16px', background: '#f9fafb' }}>
                        <FieldLabel>Transaction</FieldLabel>
                        <FieldValue size={14} bold={700}>
                            {paymentModeLabel}
                        </FieldValue>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3, fontWeight: 500 }}>
                            Collected by: {receiverName}
                        </div>
                    </div>
                </div>

                {/* ══════════════════  FEE TABLE + SUMMARY  ═════════════════ */}
                <div className="ncp-receipt-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 20 }}>

                    {/* Left — fee table */}
                    <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{
                                        textAlign: 'left', padding: '8px 0 8px',
                                        fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em',
                                        textTransform: 'uppercase', color: '#6b7280',
                                        borderBottom: '1px solid #d1d5db',
                                    }}>
                                        Fee Description
                                    </th>
                                    <th style={{
                                        textAlign: 'right', padding: '8px 0 8px',
                                        fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em',
                                        textTransform: 'uppercase', color: '#6b7280',
                                        borderBottom: '1px solid #d1d5db',
                                    }}>
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '12px 0 8px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                                        Academic Tuition Fee
                                    </td>
                                    <td style={{ padding: '12px 0 8px', fontSize: 14, fontWeight: 700, textAlign: 'right', color: '#111827' }}>
                                        {formatCurrency(enrollment.netFee)}
                                    </td>
                                </tr>

                                {payment.transactionRef && (
                                    <tr>
                                        <td colSpan={2} style={{ padding: '4px 0', fontSize: 11, color: '#9ca3af' }}>
                                            Ref: {payment.transactionRef}
                                            {payment.bankName ? ` · ${payment.bankName}` : ''}
                                            {payment.chequeNumber ? ` · Cheque #${payment.chequeNumber}` : ''}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <Divider style={{ marginTop: 8, marginBottom: 14 }} />

                        {/* Amount in words */}
                        <div style={{
                            padding: '10px 14px',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: 6,
                        }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
                                Amount in Words
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', textTransform: 'capitalize', fontStyle: 'italic' }}>
                                Rupees {amountInWords} only
                            </div>
                        </div>
                    </div>

                    {/* Right — summary panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 0 }}>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>

                            {/* Previous balance */}
                            <div style={{ padding: '11px 14px', borderBottom: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
                                    Previous Balance
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>
                                    {formatCurrency(balanceBefore)}
                                </div>
                            </div>

                            {/* Amount paid — highlighted */}
                            <div style={{ padding: '11px 14px', background: '#ecfdf5', borderBottom: '1px solid #d1fae5' }}>
                                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#059669', marginBottom: 4 }}>
                                    Amount Paid
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>
                                    {formatCurrency(amountPaid)}
                                </div>
                            </div>

                            {/* Remaining balance */}
                            <div style={{ padding: '11px 14px', background: isPaid ? '#f0fdf4' : '#fff' }}>
                                <div style={{
                                    fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: isPaid ? '#059669' : '#9ca3af',
                                    marginBottom: 4,
                                }}>
                                    {isPaid ? 'Status' : 'Remaining Balance'}
                                </div>
                                {isPaid ? (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>
                                            CLEARED — No Dues
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>
                                        {formatCurrency(balanceAfter)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════  FOOTER  ═══════════════════════════ */}
                <Divider style={{ marginBottom: 20 }} />
                <div className="ncp-receipt-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {/* Parent signature */}
                    <div style={{ textAlign: 'center', minWidth: 160 }}>
                        <div style={{ height: 36 }} />
                        <div style={{ borderTop: '1px solid #374151', paddingTop: 6 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151' }}>
                                Parent / Guardian
                            </div>
                        </div>
                    </div>

                    {/* Center — PAID stamp */}
                    <div style={{
                        width: 64, height: 64,
                        border: '2px solid #374151',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: 'rotate(-12deg)',
                        fontSize: 10, fontWeight: 900,
                        color: '#374151', textAlign: 'center',
                        letterSpacing: '0.04em',
                        flexShrink: 0,
                    }}>
                        PAID<br />VERIFIED
                    </div>

                    {/* Authorized signatory */}
                    <div style={{ textAlign: 'center', minWidth: 160 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                            {receiverName}
                        </div>
                        <div style={{ borderTop: '1px solid #374151', paddingTop: 6 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151' }}>
                                Authorized Signatory
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════  DISCLAIMER  ═══════════════════════════ */}
                <div style={{ marginTop: 20, paddingTop: 10, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <p style={{ fontSize: 9.5, color: '#9ca3af', margin: 0, fontWeight: 500 }}>
                        This is a computer-generated document and does not require a physical signature. &nbsp;|&nbsp; © {new Date().getFullYear()} {INST.name}
                    </p>
                </div>

            </div>
        </>
    );
}
