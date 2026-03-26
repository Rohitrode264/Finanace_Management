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
    // Calculations for better transparency
    const originalFee = enrollment.totalFee;
    const concessionAmount = originalFee - enrollment.netFee;
    const netPayable = enrollment.netFee;
    const amountReceivedThisTime = payment.amount;
    const balanceRemaining = enrollment.outstandingBalance ?? 0;
    const totalPaidToDate = netPayable - balanceRemaining;

    const template = typeof academicClass?.templateId === 'object' ? academicClass.templateId as ClassTemplate : null;
    const className = template ? `${template.grade}${template.stream ? ` (${template.stream})` : ''} - ${template.board}` : 'N/A';

    const formattedDate = receipt?.createdAt ? format(new Date(receipt.createdAt), 'dd MMMM yyyy') : 'N/A';
    const amountInWords = numberToWords(amountReceivedThisTime);

    // Authorized receiver name (populated from backend)
    const receivedByObj = (payment as any)?.receivedBy;
    const receiverName =
        receivedByObj?.name ||
        (receivedByObj?.firstName ? `${receivedByObj.firstName} ${receivedByObj.lastName || ''}`.trim() : null) ||
        'Authorized Clerk';

    const paymentModeLabels: Record<string, string> = {
        CASH: '💷 Cash',
        UPI: '📱 UPI / Online',
        CARD: '💳 Card',
        CHEQUE: '🧾 Cheque',
        BANK_TRANSFER: '🏦 Bank Transfer',
    };
    const paymentModeLabel = paymentModeLabels[payment.paymentMode] || payment.paymentMode;

    return (
        <div className="receipt-modern-skin" style={{
            width: '100%', maxWidth: '840px', margin: '0 auto', background: '#fff',
            fontFamily: "'Inter', system-ui, sans-serif", color: '#000',
            borderRadius: 8, overflow: 'hidden',
            border: '2px solid #000', padding: '0'
        }}>
            {/* BRAND HEADER - WIDE - HIGH CONTRAST */}
            <div style={{ background: '#fff', padding: '20px 32px', borderBottom: '3px solid #000', color: '#000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ border: '3px solid #000', color: '#000', width: 50, height: 50, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '28px', lineHeight: 1 }}>CP</div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>NEW CAREER POINT</div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, opacity: 0.9 }}>Vaibhav Complex, Nagpur. | Ph: 9876543210</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>Official Receipt</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.05em' }}>#{receipt?.receiptNumber}</div>
                    </div>
                </div>
            </div>

            {/* STATUS RIBBON - PLAIN */}
            <div style={{ background: '#eee', padding: '8px 32px', borderBottom: '2px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Dated: <span style={{ fontWeight: 800 }}>{formattedDate}</span></div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Academic Year: {enrollment.academicYear}</div>
            </div>

            {/* CONTENT GRID - 3 COLUMNS FOR WIDE VIEW */}
            <div style={{ padding: '24px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', marginBottom: 24, borderBottom: '1px solid #000', paddingBottom: 20 }}>
                    <section>
                        <h4 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8, color: '#444' }}>Student Info</h4>
                        <div style={{ fontSize: '1.125rem', fontWeight: 900, marginBottom: 4 }}>{student?.firstName} {student?.lastName}</div>
                        <div style={{ fontSize: '0.875rem' }}>Adm No: <strong>{student?.admissionNumber}</strong></div>
                        <div style={{ fontSize: '0.875rem' }}>Class: <strong>{className?.replace('Grade', 'Class')}</strong></div>
                    </section>
                    <section>
                        <h4 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8, color: '#444' }}>Parent Info</h4>
                        <div style={{ fontSize: '0.875rem', marginBottom: 4 }}>Father: <strong>{student?.fatherName}</strong></div>
                        <div style={{ fontSize: '0.875rem', marginBottom: 4 }}>Mother: <strong>{student?.motherName}</strong></div>
                        <div style={{ fontSize: '0.875rem' }}>Phone: <strong>{student?.phone}</strong></div>
                    </section>
                    <section>
                        <h4 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8, color: '#444' }}>Transaction Info</h4>
                        <div style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: 4 }}>Mode: {paymentModeLabel}</div>
                        {payment.transactionRef && <div style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>Ref: {payment.transactionRef}</div>}
                        <div style={{ fontSize: '0.875rem', marginTop: 8 }}>Cashier: <strong>{receiverName}</strong></div>
                    </section>
                </div>

                {/* FEE TABLE & SUMMARY - SIDE BY SIDE FOR HALF-A4 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                    <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#eee', borderBottom: '2px solid #000' }}>
                                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 800 }}>Fee Details</th>
                                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 800 }}>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px 16px' }}>Course Total (Inclusive of Tax)</td>
                                    <td style={{ padding: '8px 16px', textAlign: 'right' }}>{formatCurrency(originalFee)}</td>
                                </tr>
                                {concessionAmount > 0 && (
                                    <tr style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px 16px', color: '#666' }}>Scholarship / Concession (-)</td>
                                        <td style={{ padding: '8px 16px', textAlign: 'right', color: '#666' }}>- {formatCurrency(concessionAmount)}</td>
                                    </tr>
                                )}
                                <tr style={{ borderTop: '2px solid #000', fontWeight: 900, background: '#fcfcfc' }}>
                                    <td style={{ padding: '10px 16px' }}>Net Enrollment Fee</td>
                                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>{formatCurrency(netPayable)}</td>
                                </tr>
                                {payment.allocation?.map((alloc: any) => (
                                    <tr key={alloc.installmentNo} style={{ fontSize: '0.75rem', color: '#4f46e5' }}>
                                        <td style={{ padding: '4px 16px 4px 32px' }}>⤷ Applied to Installment {alloc.installmentNo}</td>
                                        <td style={{ padding: '4px 16px', textAlign: 'right' }}>{formatCurrency(alloc.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: 12, fontSize: '0.8125rem', fontWeight: 600, fontStyle: 'italic' }}>
                            Amount in Words: <span style={{ fontWeight: 800, fontStyle: 'normal' }}>Rupees {amountInWords} Only</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ padding: '16px', border: '3px solid #000', borderRadius: 8, background: '#fdfdfd' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>Amount Received Now</div>
                            <div style={{ fontSize: '1.875rem', fontWeight: 950, letterSpacing: '-0.02em' }}>{formatCurrency(amountReceivedThisTime)}</div>
                        </div>
                        <div style={{ padding: '12px 16px', border: '1px solid #000', borderRadius: 8, fontSize: '0.875rem', background: '#eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span>Paid till yesterday :</span>
                                <strong>{formatCurrency(totalPaidToDate - amountReceivedThisTime)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid #ccc' }}>
                                <span>Total Paid till date :</span>
                                <strong>{formatCurrency(totalPaidToDate)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontWeight: 700 }}>Unpaid Balance :</span>
                                <span style={{ fontWeight: 950, fontSize: '1.125rem' }}>{formatCurrency(balanceRemaining)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SIGNATURES AREA - BW - WIDER */}
            <div style={{ padding: '20px 32px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px dashed #000' }}>
                <div style={{ textAlign: 'center', minWidth: 160 }}>
                    <div style={{ borderBottom: '1.5px solid #000', width: '100%', height: 40 }}></div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginTop: 10 }}>Student/Parent Signature</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 70, height: 70, border: '3px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', transform: 'rotate(-10deg)' }}>
                        <div style={{ fontWeight: 950, fontSize: '13px' }}>RECEIVED</div>
                    </div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 180 }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 900, marginBottom: 4 }}>{receiverName}</div>
                    <div style={{ borderTop: '2.5px solid #000', width: '100%', paddingTop: 6 }}></div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Cashier / Principal Authorized</div>
                </div>
            </div>

            <style>{`
                @media print {
                    .receipt-modern-skin {
                        border: 2px solid #000 !important;
                        border-radius: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        box-shadow: none !important;
                    }
                    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    @page { size: A5 landscape; margin: 4mm; }
                }
            `}</style>
        </div>
    );
}
