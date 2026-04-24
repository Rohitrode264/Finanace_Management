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

/* ─────────────────────────────────────────────────────────────────────────── */

export function ProfessionalReceipt({
    receipt, payment, enrollment, student, academicClass,
}: ProfessionalReceiptProps) {
    const amountPaid    = payment.amount;
    const balanceAfter  = enrollment.outstandingBalance ?? 0;
    const balanceBefore = balanceAfter + amountPaid;

    const template  = typeof academicClass?.templateId === 'object' ? academicClass.templateId as ClassTemplate : null;
    const className = template
        ? `${template.grade}${template.stream ? ` (${template.stream})` : ''} — ${template.board}`
        : 'N/A';

    const formattedDate  = receipt?.createdAt ? format(new Date(receipt.createdAt), 'dd MMM yyyy') : 'N/A';
    const formattedTime  = receipt?.createdAt ? format(new Date(receipt.createdAt), 'hh:mm a') : '';
    const amountInWords  = numberToWords(amountPaid);

    const receivedByObj  = (payment as any)?.receivedBy;
    const receiverName   =
        typeof receivedByObj === 'object'
            ? (receivedByObj?.name || (receivedByObj?.firstName
                ? `${receivedByObj.firstName} ${receivedByObj.lastName || ''}`.trim()
                : null))
            : (typeof receivedByObj === 'string' ? receivedByObj : null) || 'Authorized Staff';

    const paymentModeLabel = PAYMENT_MODE_LABELS[payment.paymentMode] || payment.paymentMode;
    const isPaid           = balanceAfter <= 0;

    /* ── inline style helpers ── */
    const label = (extra?: React.CSSProperties): React.CSSProperties => ({
        fontSize: 7.5, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#6b7280', marginBottom: 2,
        ...extra,
    });

    return (
        <>
            {/* ══════════════════════ STYLES ══════════════════════════════════ */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

                /* ── Shared container ── */
                .r-wrap {
                    width: 100%;
                    max-width: 560px;
                    margin: 0 auto;
                    background: #fff;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    color: #111827;
                    box-sizing: border-box;
                }

                /* ── Responsive (screen, narrow) ── */
                @media (max-width: 560px) {
                    .r-wrap { padding: 14px 12px !important; }
                    .r-hdr  { flex-direction: column !important; gap: 10px !important; }
                    .r-meta { text-align: left !important; }
                    .r-info { grid-template-columns: 1fr !important; }
                    .r-fin  { grid-template-columns: 1fr !important; gap: 10px !important; }
                    .r-sig  { flex-direction: column !important; align-items: center !important; gap: 20px !important; }
                }

                /* ── Print ── */
                @media print {
                    @page {
                        size: A5 portrait;
                        margin: 0; /* Margin is handled by the receiver's wrapper or absolute positioning if needed, but 0 is safest for consistency */
                    }
                    
                    html, body { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        background: #fff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .r-wrap {
                        width: 148mm !important; /* A5 Width */
                        max-width: 148mm !important;
                        margin: 0 auto !important;
                        padding: 10mm 12mm !important; /* Internal padding for the paper */
                        box-shadow: none !important;
                        border: none !important;
                        background: #fff !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        overflow: visible !important;
                    }

                    .r-hdr, .r-sig, .r-hdr-brand, .r-hdr-regs {
                        display: flex !important;
                        flex-direction: row !important;
                    }

                    .r-hdr, .r-sig {
                        justify-content: space-between !important;
                    }

                    .r-hdr-brand {
                        align-items: center !important;
                        gap: 9px !important;
                    }

                    .r-hdr-regs {
                        gap: 9px !important;
                    }

                    .r-sig {
                        align-items: flex-end !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* ═══════════════════════ RECEIPT BODY ═══════════════════════════ */}
            <div className="r-wrap">

                {/* ── HEADER ────────────────────────────────────────────────── */}
                <div className="r-hdr" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    paddingBottom: 9, borderBottom: '2px solid #111827', marginBottom: 9,
                }}>
                    {/* Branding */}
                    <div className="r-hdr-brand" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <img
                            src="/images/logo_bw.jpg" alt="Logo"
                            style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 5 }}
                        />
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', lineHeight: 1 }}>
                                {INST.name}
                            </div>
                            <div style={{ fontSize: 9, fontWeight: 600, color: '#374151', marginTop: 2 }}>
                                {INST.subtitle}
                            </div>
                            <div style={{ fontSize: 8.5, color: '#6b7280', marginTop: 2 }}>
                                {INST.address}&nbsp;|&nbsp;{INST.phone}
                            </div>
                            <div className="r-hdr-regs" style={{ fontSize: 7.5, color: '#9ca3af', marginTop: 1, display: 'flex', gap: 9 }}>
                                <span>Reg: <strong style={{ color: '#6b7280' }}>{INST.regNo}</strong></span>
                                <span>GSTIN: <strong style={{ color: '#6b7280' }}>{INST.gstin}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Receipt meta */}
                    <div className="r-meta" style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                            display: 'inline-block', border: '1.5px solid #111827',
                            borderRadius: 3, padding: '2px 8px',
                            fontSize: 7.5, fontWeight: 800, letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: '#111827', marginBottom: 5,
                        }}>
                            Payment Receipt
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
                            #{receipt?.receiptNumber}
                        </div>
                        <div style={{ fontSize: 9.5, color: '#374151', fontWeight: 600, marginTop: 1 }}>
                            {formattedDate}
                        </div>
                        {formattedTime && (
                            <div style={{ fontSize: 8, color: '#9ca3af', marginTop: 1 }}>
                                {formattedTime}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── STUDENT / COURSE / TRANSACTION ───────────────────────── */}
                <div className="r-info" style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 0, marginBottom: 9,
                    border: '1px solid #e5e7eb', borderRadius: 5, overflow: 'hidden',
                }}>
                    {/* Student */}
                    <div style={{ padding: '7px 9px', background: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
                        <div style={label()}>Student</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                            {student?.firstName} {student?.lastName}
                        </div>
                        <div style={{ fontSize: 8.5, color: '#6b7280', marginTop: 2, fontWeight: 500 }}>
                            ID: {student?.admissionNumber}
                        </div>
                    </div>

                    {/* Course */}
                    <div style={{ padding: '7px 9px', background: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
                        <div style={label()}>Course / Class</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                            {className}
                        </div>
                        <div style={{ fontSize: 8.5, color: '#6b7280', marginTop: 2, fontWeight: 500 }}>
                            Session: {enrollment.academicYear}
                        </div>
                    </div>

                    {/* Transaction */}
                    <div style={{ padding: '7px 9px', background: '#f9fafb' }}>
                        <div style={label()}>Transaction</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                            {paymentModeLabel}
                        </div>
                        <div style={{ fontSize: 8.5, color: '#6b7280', marginTop: 2, fontWeight: 500 }}>
                            By: {receiverName}
                        </div>
                    </div>
                </div>

                {/* ── FEE TABLE  +  BALANCE SUMMARY ────────────────────────── */}
                <div className="r-fin" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12, marginBottom: 9 }}>

                    {/* Left — fee table + amount in words */}
                    <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '4px 0', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #d1d5db' }}>
                                        Fee Description
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '4px 0', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #d1d5db' }}>
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '6px 0 4px', fontSize: 12, fontWeight: 600, color: '#111827' }}>
                                        Academic Tuition Fee
                                        {enrollment.totalFee > enrollment.netFee && (
                                            <div style={{ fontSize: 8.5, color: '#6b7280', fontWeight: 500, marginTop: 1 }}>
                                                Fees: {formatCurrency(enrollment.totalFee)} · Concession: {formatCurrency(enrollment.totalFee - enrollment.netFee)}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '6px 0 4px', fontSize: 12, fontWeight: 700, textAlign: 'right', color: '#111827', verticalAlign: 'top' }}>
                                        {formatCurrency(enrollment.netFee)}
                                    </td>
                                </tr>
                                {payment.transactionRef && (
                                    <tr>
                                        <td colSpan={2} style={{ padding: '2px 0', fontSize: 8.5, color: '#9ca3af' }}>
                                            Ref: {payment.transactionRef}
                                            {payment.bankName ? ` · ${payment.bankName}` : ''}
                                            {payment.chequeNumber ? ` · Cheque #${payment.chequeNumber}` : ''}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '5px 0 7px' }} />

                        {/* Amount in words */}
                        <div style={{ padding: '7px 9px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 5 }}>
                            <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 3 }}>
                                Amount in Words
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', textTransform: 'capitalize', fontStyle: 'italic', lineHeight: 1.3 }}>
                                Rupees {amountInWords} only
                            </div>
                        </div>
                    </div>

                    {/* Right — balance panel */}
                    <div>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 5, overflow: 'hidden' }}>

                            {/* Previous balance */}
                            <div style={{ padding: '7px 9px', borderBottom: '1px solid #e5e7eb' }}>
                                <div style={label({ color: '#9ca3af' })}>Previous Balance</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
                                    {formatCurrency(balanceBefore)}
                                </div>
                            </div>

                            {/* Amount paid */}
                            <div style={{ padding: '7px 9px', background: '#ecfdf5', borderBottom: '1px solid #d1fae5' }}>
                                <div style={label({ color: '#059669' })}>Amount Paid</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>
                                    {formatCurrency(amountPaid)}
                                </div>
                            </div>

                            {/* Remaining / status */}
                            <div style={{ padding: '7px 9px', background: isPaid ? '#f0fdf4' : '#fff' }}>
                                <div style={label({ color: isPaid ? '#059669' : '#9ca3af' })}>
                                    {isPaid ? 'Status' : 'Remaining Balance'}
                                </div>
                                {isPaid ? (
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#059669' }}>
                                        CLEARED — No Dues
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>
                                        {formatCurrency(balanceAfter)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER (signatures + stamp) ──────────────────────────── */}
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 10px' }} />
                <div className="r-sig" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>

                    {/* Parent signature */}
                    <div style={{ textAlign: 'center', minWidth: 110 }}>
                        <div style={{ height: 26 }} />
                        <div style={{ borderTop: '1px solid #374151', paddingTop: 4 }}>
                            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151' }}>
                                Parent / Guardian
                            </div>
                        </div>
                    </div>

                    {/* PAID stamp */}
                    <div style={{
                        width: 50, height: 50,
                        border: '2px solid #374151', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: 'rotate(-12deg)',
                        fontSize: 8, fontWeight: 900,
                        color: '#374151', textAlign: 'center', letterSpacing: '0.04em',
                        flexShrink: 0,
                    }}>
                        PAID<br />VERIFIED
                    </div>

                    {/* Authorized signatory */}
                    <div style={{ textAlign: 'center', minWidth: 110 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                            {receiverName}
                        </div>
                        <div style={{ borderTop: '1px solid #374151', paddingTop: 4 }}>
                            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151' }}>
                                Authorized Signatory
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── DISCLAIMER ───────────────────────────────────────────── */}
                <div style={{ marginTop: 9, paddingTop: 7, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <p style={{ fontSize: 7.5, color: '#9ca3af', margin: 0, fontWeight: 500 }}>
                        This is a computer-generated document and does not require a physical signature.&nbsp;|&nbsp;
                        © {new Date().getFullYear()} {INST.name}
                    </p>
                </div>

            </div>
        </>
    );
}
