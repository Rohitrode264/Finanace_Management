import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Search, CreditCard, X, Printer, UserCheck, Download, CheckCircle2, Eye
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { useDebounce } from '../../hooks/useDebounce';
import { studentsService } from '../../api/services/students.service';
import { paymentService } from '../../api/services/payment.service';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { Student, Enrollment, PaymentMode, ProcessPaymentResult, AcademicClass, ClassTemplate } from '../../types';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { ProfessionalReceipt } from '../../components/receipts/ProfessionalReceipt';
import { Modal } from '../../components/ui/Modal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
    { value: 'CASH', label: 'Cash' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CARD', label: 'Card' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

export function PaymentEntryPage() {
    const user = useAuthStore((s) => s.user);

    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [enrollment, setEnrollment] = useState<(Enrollment & { outstandingBalance?: number }) | null>(null);
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
    const [transactionRef, setTransactionRef] = useState('');
    const [bankName, setBankName] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [chequeDate, setChequeDate] = useState('');
    const [step, setStep] = useState<'search' | 'enrollment' | 'pay' | 'success'>('search');
    const [result, setResult] = useState<ProcessPaymentResult | null>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedInsts, setSelectedInsts] = useState<number[]>([]);
    const dSearch = useDebounce(studentSearch, 500);
    const receiptRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);

    const fetchAndShowReceipt = async (paymentId: string) => {
        try {
            const receiptRes = await apiClient.get(`/receipts/by-payment/${paymentId}`);
            const receipt = receiptRes.data.data;
            const paymentsRes = await apiClient.get(`/payments/${paymentId}`);
            const payment = paymentsRes.data.data;

            // Fetch the updated enrollment to get the fresh post-payment outstandingBalance
            // This exactly mirrors the LedgerPage logic where selectedEnrollment is always fresh
            const enrollmentRes = await apiClient.get(`/enrollments/${enrollment?._id}`);
            const freshEnrollment = enrollmentRes.data.data;

            const classId = typeof freshEnrollment?.academicClassId === 'object'
                ? (freshEnrollment.academicClassId as any)._id
                : freshEnrollment?.academicClassId;
            const classRes = await apiClient.get(`/classes/${classId}`);

            setReceiptData({
                receipt,
                payment,
                enrollment: freshEnrollment,
                student: selectedStudent,
                academicClass: classRes.data.data
            });
            setShowReceiptModal(true);
        } catch (err) {
            console.error("Failed to fetch receipt:", err);
            toast.error("Failed to generate receipt preview.");
        }
    };

    const { data: studentsRes, isLoading: sLoading } = useQuery({
        queryKey: ['student-search', dSearch],
        queryFn: () => studentsService.list({ search: dSearch, limit: 8 }),
        enabled: dSearch.length >= 2,
    });

    const students: Student[] = (studentsRes?.data?.data as any)?.students ?? [];
    const numericAmount = parseFloat(amount) || 0;

    // Fetch enrollments by student ID automatically
    const { data: studentEnrollmentsRes, isLoading: eLoading } = useQuery({
        queryKey: ['enrollments-for-student', selectedStudent?._id],
        queryFn: () => apiClient.get(`/enrollments/student/${selectedStudent?._id}`),
        enabled: !!selectedStudent && step === 'enrollment',
    });
    const studentEnrollments: (Enrollment & { outstandingBalance?: number })[] = studentEnrollmentsRes?.data?.data || [];

    const handleSelectEnrollment = (e: Enrollment & { outstandingBalance?: number }) => {
        setEnrollment(e);
        setStep('pay');
    };

    const createPaymentMutation = useMutation({
        mutationFn: () =>
            paymentService.create({
                enrollmentId: enrollment!._id,
                amount: numericAmount,
                paymentMode,
                transactionRef: transactionRef || undefined,
                bankName: paymentMode === 'CHEQUE' ? bankName : undefined,
                chequeNumber: paymentMode === 'CHEQUE' ? chequeNumber : undefined,
                chequeDate: paymentMode === 'CHEQUE' ? chequeDate : undefined,
                fingerprintVerified: false,
            }),
        onSuccess: (res) => {
            const d = res.data?.data;
            if (d) setResult(d);
            setStep('success');
            toast.success(`Payment recorded! Receipt: ${d?.receiptNumber}`);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Payment failed. Please try again.'),
    });

    const resetFlow = () => {
        setStudentSearch(''); setSelectedStudent(null);
        setEnrollment(null); setAmount(''); setPaymentMode('CASH'); setTransactionRef('');
        setBankName(''); setChequeNumber(''); setChequeDate('');
        setStep('search'); setResult(null);
        setSelectedInsts([]);
    };

    const downloadPDF = async () => {
        if (!receiptRef.current || !receiptData) return;
        setDownloading(true);
        try {
            const element = receiptRef.current;
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Receipt_${receiptData.receipt.receiptNumber}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate PDF');
        } finally {
            setDownloading(false);
        }
    };

    const steps = ['search', 'enrollment', 'pay', 'success'] as const;
    const stepLabels = { search: 'Student', enrollment: 'Enrollment', pay: 'Payment', success: 'Receipt' };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <style>{`
                @media print {
                    /* Hide everything by default */
                    body > *, #root > *, .modal-overlay, .modal-header, .no-print, nav, aside, footer, button, .btn-primary, .btn-secondary {
                        display: none !important;
                    }
                    /* ONLY show the receipt container and its ancestors if needed, 
                       but since Modal is a portal, it is at the end of body. 
                    */
                    body > .modal-overlay {
                        display: block !important;
                        position: static !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: none !important;
                    }
                    .modal-content {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        height: 100% !important;
                        max-width: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: none !important;
                        transform: none !important;
                        overflow: visible !important;
                    }
                    .receipt-premium-container {
                        display: block !important;
                    }
                    /* Ensure background graphics are printed */
                    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    @page { size: A5 landscape; margin: 0; }
                }
            `}</style>
            <PageHeader
                title="Fee Collection Interface"
                subtitle="Record payments and generate receipts for student enrollments."
            />

            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                {steps.map((s, i) => {
                    const doneIndex = steps.indexOf(step);
                    const done = i < doneIndex;
                    const active = step === s;
                    return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: done ? '#10b981' : active ? '#6366f1' : 'var(--bg-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem', fontWeight: 700, color: '#fff', transition: 'background 0.3s',
                            }}>{i + 1}</div>
                            <span style={{ fontSize: '0.8125rem', color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 600 : 400 }}>
                                {stepLabels[s]}
                            </span>
                            {i < steps.length - 1 && <div style={{ height: 1, width: 24, background: 'var(--border)' }} />}
                        </div>
                    );
                })}
            </div>

            {/* Step 1: Student Search */}
            {step === 'search' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Search size={18} color="#6366f1" /> Search Student
                    </h3>
                    <input
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="form-input"
                        placeholder="Type student name or admission number..."
                        style={{ marginBottom: 12 }}
                    />
                    {dSearch.length >= 2 && (
                        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                            {sLoading ? (
                                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>Searching...</div>
                            ) : students.length === 0 ? (
                                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>No students found</div>
                            ) : (
                                students.map(s => (
                                    <button
                                        key={s._id}
                                        onClick={() => { setSelectedStudent(s); setStep('enrollment'); }}
                                        style={{
                                            width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border)',
                                            background: 'var(--bg-surface)', cursor: 'pointer', textAlign: 'left',
                                            display: 'flex', alignItems: 'center', gap: 12,
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                                    >
                                        <div style={{
                                            width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                                        }}>
                                            {s.firstName.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {s.firstName} {s.lastName}
                                                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: s.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: s.status === 'ACTIVE' ? '#10b981' : '#ef4444' }}>{s.status}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                ID: <strong style={{ color: 'var(--text-primary)' }}>{s.admissionNumber}</strong> &middot; Phone: {s.phone}
                                                <br />
                                                Parent: {s.fatherName} {s.email ? `· Email: ${s.email}` : ''} {s.bloodGroup ? `· Blood: ${s.bloodGroup}` : ''}
                                                {s.address?.city && ` · City: ${s.address.city}`}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Step 2: Enrollment ID */}
            {step === 'enrollment' && selectedStudent && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Student header */}
                    <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(99,102,241,0.04)' }}>
                        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                            {selectedStudent.firstName.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{selectedStudent.firstName} {selectedStudent.lastName}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{selectedStudent.admissionNumber} · {selectedStudent.phone}</div>
                        </div>
                        <button onClick={resetFlow} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={16} />
                        </button>
                    </div>

                    <div className="card" style={{ padding: 24 }}>
                        <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Select Course / Enrollment</h4>
                        {eLoading ? (
                            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>Loading enrollments...</div>
                        ) : studentEnrollments.length === 0 ? (
                            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                                This student has no active enrollments.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {studentEnrollments.map(e => (
                                    <button
                                        key={e._id}
                                        onClick={() => handleSelectEnrollment(e)}
                                        style={{
                                            padding: 16, border: '1px solid var(--border)', borderRadius: 12,
                                            background: 'var(--bg-surface)', cursor: 'pointer', textAlign: 'left',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={ev => (ev.currentTarget.style.borderColor = '#6366f1')}
                                        onMouseLeave={ev => (ev.currentTarget.style.borderColor = 'var(--border)')}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                                {(() => {
                                                    const cls = e.academicClassId as any as AcademicClass;
                                                    const t = typeof cls?.templateId === 'object' ? cls.templateId as ClassTemplate : null;
                                                    const program = selectedStudent?.program ? `${selectedStudent.program} — ` : '';
                                                    if (t) return `${program}Class ${t.grade}${t.stream ? ` – ${t.stream}` : ''} (${t.board}) — Sec ${cls.section}`;
                                                    return `${program}Enrollment ID: ${e._id.slice(-6)}`;
                                                })()}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                Year: {e.academicYear} &middot; Status: <span style={{ color: e.status === 'ONGOING' ? '#10b981' : 'var(--text-muted)' }}>{e.status}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Outstanding Fee</div>
                                            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: (e.outstandingBalance ?? 0) > 0 ? '#ef4444' : '#10b981' }}>
                                                {formatCurrency(e.outstandingBalance ?? 0)}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button className="btn-secondary" style={{ marginTop: 20 }} onClick={() => setStep('search')}>
                            ← Back
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Step 3: Payment */}
            {step === 'pay' && enrollment && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Enrollment Summary */}
                    <div className="card" style={{ padding: 16, marginBottom: 16, background: 'rgba(16,185,129,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontWeight: 700 }}>
                                {(() => {
                                    const cls = enrollment.academicClassId as any as AcademicClass;
                                    const t = typeof cls?.templateId === 'object' ? cls.templateId as ClassTemplate : null;
                                    const prog = selectedStudent?.program ? `${selectedStudent.program} — ` : '';
                                    if (t) return `${prog}Class ${t.grade}${t.stream ? ` – ${t.stream}` : ''} (${t.board}) — Sec ${cls.section}`;
                                    return `${prog}Enrollment: ${enrollment._id.slice(-6)}`;
                                })()}
                            </span>
                            <button onClick={() => setStep('enrollment')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={14} />
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: '0.8125rem' }}>
                            <div><span style={{ color: 'var(--text-muted)' }}>Net Fee:</span> <strong>{formatCurrency(enrollment.netFee)}</strong></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Outstanding:</span> <strong style={{ color: '#ef4444' }}>{formatCurrency(enrollment.outstandingBalance ?? 0)}</strong></div>
                            <div>
                                <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                                    background: enrollment.status === 'ONGOING' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: enrollment.status === 'ONGOING' ? '#10b981' : '#ef4444',
                                }}>{enrollment.status}</span>
                            </div>
                        </div>
                        {enrollment.concessionType !== 'NONE' && (
                            <div style={{ marginTop: 8, fontSize: '0.8125rem', color: '#f59e0b' }}>
                                Concession: {enrollment.concessionType === 'PERCENTAGE' ? `${enrollment.concessionValue}%` : formatCurrency(enrollment.concessionValue)} applied
                            </div>
                        )}
                    </div>

                    {/* Installment plan */}
                    {enrollment.status === 'ONGOING' && (
                        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                            <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Installment Plan</h4>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Due Date</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                        <th style={{ textAlign: 'right' }}>Paid</th>
                                        <th style={{ textAlign: 'right' }}>Remaining</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const plan = (typeof enrollment.academicClassId === 'object'
                                            ? (enrollment.academicClassId as any).installmentPlan
                                            : []) || [];

                                        const sortedPlan = [...plan].sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                                        const totalPaidCash = enrollment.netFee - (enrollment.outstandingBalance ?? 0);
                                        let tempRemainingCash = totalPaidCash;
                                        let tempRemainingConcession = enrollment.totalFee - enrollment.netFee;

                                        return sortedPlan.map((ins: any) => {
                                            const amt = ins.amount;

                                            // 1. Concession covers it first
                                            const concessionCover = Math.min(amt, tempRemainingConcession);
                                            tempRemainingConcession -= concessionCover;

                                            // 2. Cash covers the rest
                                            const paid = Math.min(amt - concessionCover, Math.max(0, tempRemainingCash));
                                            tempRemainingCash -= paid;

                                            const remaining = amt - concessionCover - paid;

                                            const isFullyPaid = remaining < 0.01;
                                            const isPartiallyPaid = (paid + concessionCover) > 0.01 && !isFullyPaid;

                                            return (
                                                <tr key={ins.installmentNo}>
                                                    <td>{ins.installmentNo}</td>
                                                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{format(new Date(ins.dueDate), 'dd MMM yyyy')}</td>
                                                    <td className="financial-value" style={{ color: 'var(--text-primary)' }}>{formatCurrency(amt)}</td>
                                                    <td className="financial-value" style={{ color: '#10b981' }}>{formatCurrency(paid + concessionCover)}</td>
                                                    <td className="financial-value" style={{ color: remaining > 0.01 ? '#ef4444' : 'var(--text-muted)' }}>{formatCurrency(remaining)}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{
                                                            fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                                                            background: isFullyPaid ? 'rgba(16,185,129,0.1)' : isPartiallyPaid ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                                            color: isFullyPaid ? '#10b981' : isPartiallyPaid ? '#f59e0b' : '#ef4444'
                                                        }}>
                                                            {isFullyPaid ? 'PAID' : isPartiallyPaid ? 'PARTIAL' : 'DUE'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {enrollment.status !== 'ONGOING' && (
                        <div style={{ padding: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 16, color: '#ef4444', fontSize: '0.875rem' }}>
                            ⚠️ This enrollment is {enrollment.status}. Payments cannot be processed.
                        </div>
                    )}

                    {/* Payment form */}
                    {enrollment.status === 'ONGOING' && (() => {
                        const plan = (typeof enrollment.academicClassId === 'object' ? (enrollment.academicClassId as any).installmentPlan : []) || [];
                        const sortedPlan = [...plan].sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                        const numericAmount = parseFloat(amount) || 0;

                        let tempTotalPaid = enrollment.netFee - (enrollment.outstandingBalance ?? 0);
                        let tempTotalConcession = enrollment.totalFee - enrollment.netFee;

                        const dueInstallments = sortedPlan.map((ins: any) => {
                            const amt = ins.amount;
                            const concessionCover = Math.min(amt, tempTotalConcession);
                            tempTotalConcession -= concessionCover;

                            const paid = Math.min(amt - concessionCover, Math.max(0, tempTotalPaid));
                            tempTotalPaid -= paid;

                            return { ...ins, remaining: Math.max(0, amt - concessionCover - paid) };
                        }).filter((ins: any) => ins.remaining > 0.01);

                        return (
                            <div className="card" style={{ padding: 24 }}>
                                <h4 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CreditCard size={16} color="#6366f1" /> Payment Details
                                </h4>

                                {dueInstallments.length > 0 && (
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            Quick Select Installments
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {dueInstallments.map((ins: any) => {
                                                const isSelected = selectedInsts.includes(ins.installmentNo);
                                                return (
                                                    <button
                                                        key={ins.installmentNo}
                                                        type="button"
                                                        onClick={() => {
                                                            let newSelected = [...selectedInsts];
                                                            let newAmount = numericAmount;

                                                            if (isSelected) {
                                                                newSelected = newSelected.filter(i => i !== ins.installmentNo);
                                                                newAmount = Math.max(0, newAmount - ins.remaining);
                                                            } else {
                                                                newSelected.push(ins.installmentNo);
                                                                newAmount += ins.remaining;
                                                            }

                                                            setSelectedInsts(newSelected);
                                                            setAmount(newAmount.toString());
                                                        }}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: 8, border: '1px solid',
                                                            borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                                                            background: isSelected ? 'rgba(99,102,241,0.1)' : 'var(--bg-surface)',
                                                            cursor: 'pointer', fontSize: '0.8125rem',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => !isSelected && (e.currentTarget.style.borderColor = '#6366f1')}
                                                        onMouseLeave={e => !isSelected && (e.currentTarget.style.borderColor = 'var(--border)')}
                                                    >
                                                        <span style={{ fontWeight: 700, color: isSelected ? 'var(--accent)' : '#6366f1' }}>Inst {ins.installmentNo}</span>
                                                        <span>{isSelected ? 'Selected' : `+ ${formatCurrency(ins.remaining)}`}</span>
                                                    </button>
                                                );
                                            })}
                                            <div style={{
                                                fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginLeft: 8
                                            }}>
                                                (Or type custom down-payment below)
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-grid" style={{ marginBottom: 16 }}>
                                    <div>
                                        <label className="form-label">Amount (₹) *</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={amount}
                                            onChange={e => {
                                                // Strip everything except digits and a single decimal point
                                                const raw = e.target.value.replace(/[^0-9.]/g, '');
                                                // Prevent multiple decimal points
                                                const parts = raw.split('.');
                                                const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
                                                setAmount(cleaned);
                                            }}
                                            className="form-input"
                                            placeholder="Enter payment amount"
                                        />
                                        {numericAmount > (enrollment.outstandingBalance ?? 0) && (
                                            <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>
                                                Amount cannot exceed the outstanding balance ({formatCurrency(enrollment.outstandingBalance ?? 0)}).
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="form-label">Payment Mode *</label>
                                        <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as PaymentMode)} className="form-select">
                                            {PAYMENT_MODES.map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {paymentMode === 'CHEQUE' ? (
                                        <>
                                            <div>
                                                <label className="form-label">Bank Name *</label>
                                                <input
                                                    value={bankName}
                                                    onChange={e => setBankName(e.target.value)}
                                                    className="form-input"
                                                    placeholder="e.g. SBI, HDFC"
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label">Cheque Number *</label>
                                                <input
                                                    value={chequeNumber}
                                                    onChange={e => setChequeNumber(e.target.value)}
                                                    className="form-input"
                                                    placeholder="6-digit number"
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label">Cheque Date *</label>
                                                <input
                                                    type="date"
                                                    value={chequeDate}
                                                    onChange={e => setChequeDate(e.target.value)}
                                                    className="form-input"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Transaction Reference (optional)</label>
                                            <input
                                                value={transactionRef}
                                                onChange={e => setTransactionRef(e.target.value)}
                                                className="form-input"
                                                placeholder={paymentMode === 'UPI' ? "UPI Ref / Transaction ID" : "Payment reference..."}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Collected By badge */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                    background: 'rgba(99,102,241,0.06)', borderRadius: 10,
                                    border: '1px solid rgba(99,102,241,0.15)', marginBottom: 16,
                                }}>
                                    <UserCheck size={16} color="#6366f1" />
                                    <div style={{ fontSize: '0.875rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Authorized Receiver: </span>
                                        <strong style={{ color: '#6366f1' }}>{user?.name || 'Unknown'}</strong>
                                    </div>
                                    <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        Your name will appear on the receipt
                                    </div>
                                </div>

                                {numericAmount > 0 && (
                                    <div style={{ padding: 12, background: 'rgba(16,185,129,0.06)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.15)', marginBottom: 16, fontSize: '0.875rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Collecting: </span>
                                        <strong style={{ color: '#10b981', fontSize: '1rem' }}>{formatCurrency(numericAmount)}</strong>
                                        <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>via {paymentMode}</span>
                                        <div style={{ fontSize: '0.75rem', marginTop: 4, opacity: 0.8 }}>
                                            The system will automatically allocate this amount to the oldest due installments first.
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="btn-primary"
                                    disabled={
                                        numericAmount <= 0 ||
                                        numericAmount > (enrollment.outstandingBalance ?? 0) ||
                                        createPaymentMutation.isPending ||
                                        (paymentMode === 'CHEQUE' && (!bankName || !chequeNumber || !chequeDate))
                                    }
                                    onClick={() => createPaymentMutation.mutate()}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {createPaymentMutation.isPending ? 'Processing...' : '✓ Confirm & Record Payment'}
                                </button>
                            </div>
                        );
                    })()}
                </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 'success' && result && selectedStudent && enrollment && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="card" style={{ padding: 48, textAlign: 'center', background: 'var(--bg-surface)', border: 'none', boxShadow: 'var(--shadow-xl)' }}>
                        <div style={{
                            width: 80, height: 80, background: 'rgba(16,185,129,0.1)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                        }}>
                            <CheckCircle2 size={40} color="#10b981" />
                        </div>
                        <h2 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: 8, color: 'var(--text-primary)' }}>Payment Collected!</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                            Transaction recorded for {selectedStudent.firstName}. Receipt <strong style={{ color: '#6366f1' }}>{result.receiptNumber}</strong> is ready.
                        </p>
                        
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button 
                                className="btn-primary" 
                                onClick={() => fetchAndShowReceipt(result.payment._id)} 
                                style={{ padding: '12px 24px', fontSize: '0.9375rem', gap: 10 }}
                            >
                                <Eye size={18} /> View & Print Receipt
                            </button>
                            <button 
                                className="btn-secondary" 
                                onClick={resetFlow} 
                                style={{ padding: '12px 24px', fontSize: '0.9375rem' }}
                            >
                                Record Another Payment
                            </button>
                        </div>
                    </div>

                    <Modal
                        isOpen={showReceiptModal}
                        onClose={() => setShowReceiptModal(false)}
                        title="Official Receipt Preview"
                        maxWidth="max-w-5xl"
                    >
                        {receiptData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={downloadPDF}
                                        disabled={downloading}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
                                    >
                                        {downloading ? 'Generating...' : <><Download size={16} /> Download PDF</>}
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={() => window.print()}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
                                    >
                                        <Printer size={16} /> Print Receipt
                                    </button>
                                </div>
                                <div ref={receiptRef}>
                                    <ProfessionalReceipt {...receiptData} />
                                </div>
                            </div>
                        )}
                    </Modal>
                </motion.div>
            )}
        </div>
    );
}
