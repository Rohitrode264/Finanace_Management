import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Receipt, Download, User as UserIcon, ArrowRight, Printer } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { studentsService } from '../../api/services/students.service';
import apiClient from '../../api/client';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import { useDebounce } from '../../hooks/useDebounce';
import type { Student, Enrollment, LedgerEntry, Receipt as ReceiptType, Payment, AcademicClass } from '../../types';
import { ProfessionalReceipt } from '../../components/receipts/ProfessionalReceipt';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Modal } from '../../components/ui/Modal';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { enrollmentService } from '../../api/services/enrollment.service';
import { usePermission } from '../../hooks/usePermission';

export function LedgerPage() {
    const [searchParams] = useSearchParams();
    const studentIdParam = searchParams.get('studentId');
    const enrollmentIdParam = searchParams.get('enrollmentId');

    const [search, setSearch] = useState('');
    const dSearch = useDebounce(search);
    const receiptRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [showConcessionModal, setShowConcessionModal] = useState(false);
    const qc = useQueryClient();
    const canConcession = usePermission('APPLY_CONCESSION');

    // Auto-select if params present
    useEffect(() => {
        if (studentIdParam && !selectedStudent) {
            apiClient.get(`/students/${studentIdParam}`).then(res => {
                setSelectedStudent(res.data.data);
            }).catch(console.error);
        }
    }, [studentIdParam, selectedStudent]);

    useEffect(() => {
        if (enrollmentIdParam && !selectedEnrollment) {
            apiClient.get(`/enrollments/${enrollmentIdParam}`).then(res => {
                setSelectedEnrollment(res.data.data);
            }).catch(console.error);
        }
    }, [enrollmentIdParam, selectedEnrollment]);

    // Receipt Modal State
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<{
        receipt: ReceiptType;
        payment: Payment;
        enrollment: Enrollment;
        student: Student;
        academicClass: AcademicClass;
    } | null>(null);

    const applyConcessionMutation = useMutation({
        mutationFn: (data: { concessionType: 'PERCENTAGE' | 'FLAT'; concessionValue: number; reason?: string }) =>
            enrollmentService.applyConcession(selectedEnrollment!._id, data),
        onSuccess: (res) => {
            const amount = (res.data?.data as any)?.concessionAmount;
            toast.success(`Concession of ${formatCurrency(amount)} applied successfully`);
            setShowConcessionModal(false);
            qc.invalidateQueries({ queryKey: ['enrollment-ledger', selectedEnrollment?._id] });
            qc.invalidateQueries({ queryKey: ['student-enrollments', selectedStudent?._id] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to apply concession'),
    });

    const downloadPDF = async () => {
        if (!receiptRef.current || !receiptData) return;
        setDownloading(true);
        try {
            const element = receiptRef.current;
            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Receipt_${receiptData.receipt.receiptNumber}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF');
        } finally {
            setDownloading(false);
        }
    };

    // Search students
    const { data: studentsRes, isLoading: searching } = useQuery({
        queryKey: ['students-search', dSearch],
        queryFn: () => studentsService.list({ search: dSearch || undefined, limit: 10 }),
        enabled: dSearch.length > 2,
    });
    const students = studentsRes?.data?.data?.students || [];

    // Get student enrollments
    const { data: enrollmentsRes, isLoading: loadingEnrollments } = useQuery({
        queryKey: ['student-enrollments', selectedStudent?._id],
        queryFn: () => apiClient.get(`/enrollments/student/${selectedStudent?._id}`),
        enabled: !!selectedStudent,
    });
    const enrollments: Enrollment[] = enrollmentsRes?.data?.data || [];

    // Get enrollment ledger
    const { data: ledgerRes, isLoading: loadingLedger } = useQuery({
        queryKey: ['enrollment-ledger', selectedEnrollment?._id],
        queryFn: () => apiClient.get(`/enrollments/${selectedEnrollment?._id}/ledger`),
        enabled: !!selectedEnrollment,
    });
    const ledger: LedgerEntry[] = ledgerRes?.data?.data?.ledger || [];
    const balance: number = ledgerRes?.data?.data?.outstandingBalance ?? 0;

    const handleSelectStudent = (s: Student) => {
        setSelectedStudent(s);
        setSearch('');
        setSelectedEnrollment(null);
    };

    const fetchAndShowReceipt = async (paymentId: string) => {
        try {
            // 1. Directly fetch the receipt associated with this payment ID
            const receiptRes = await apiClient.get(`/receipts/by-payment/${paymentId}`);
            const receipt = receiptRes.data.data;

            // 2. We still need the payment details (for data matching)
            const paymentsRes = await apiClient.get(`/payments/${paymentId}`);
            const payment = paymentsRes.data.data;

            // 3. Fetch academic class details (needed for receipt display)
            const classId = typeof selectedEnrollment?.academicClassId === 'object'
                ? (selectedEnrollment.academicClassId as any)._id
                : selectedEnrollment?.academicClassId;

            const classRes = await apiClient.get(`/classes/${classId}`);

            setReceiptData({
                receipt,
                payment,
                enrollment: selectedEnrollment!,
                student: selectedStudent!,
                academicClass: classRes.data.data
            });
            setShowReceipt(true);
        } catch (err) {
            console.error("Failed to fetch receipt:", err);
            alert("No receipt found for this transaction or failed to fetch.");
        }
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            <PageHeader
                title="Student Ledger & Receipts"
                subtitle="Search for a student to view their complete financial history and download past receipts."
            />

            <div className="ledger-grid-layout" style={{ display: 'grid', gap: 24 }}>
                {/* Left Panel: Search & Student Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Search size={18} color="#6366f1" /> Search Student
                        </h3>
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Admission ID or Name..."
                        />

                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {searching && <div style={{ padding: 12, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Searching...</div>}
                            {!searching && dSearch.length > 2 && students.length === 0 && (
                                <div style={{ padding: 12, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No students found.</div>
                            )}
                            {students.map((s: Student) => (
                                <button
                                    key={s._id}
                                    onClick={() => handleSelectStudent(s)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 8,
                                        border: 'none', background: selectedStudent?._id === s._id ? 'rgba(99,102,241,0.1)' : 'transparent',
                                        cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => selectedStudent?._id !== s._id && (e.currentTarget.style.background = 'var(--bg-subtle)')}
                                    onMouseLeave={(e) => selectedStudent?._id !== s._id && (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-muted)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontWeight: 600
                                    }}>
                                        {s.firstName.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.firstName} {s.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.admissionNumber}</div>
                                    </div>
                                    <ArrowRight size={14} color="var(--text-muted)" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedStudent && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 20, borderLeft: '4px solid #6366f1' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                                }}>
                                    <UserIcon size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{selectedStudent.admissionNumber}</p>
                                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                                            <span style={{ fontWeight: 500 }}>{selectedStudent.phone}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Parent:</span>
                                            <span style={{ fontWeight: 500 }}>{selectedStudent.fatherName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {selectedStudent && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 20 }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>Academic Enrollments</h3>
                            {loadingEnrollments ? (
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading...</div>
                            ) : enrollments.length === 0 ? (
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No enrollments found.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {enrollments.map((e) => (
                                        <button
                                            key={e._id}
                                            onClick={() => setSelectedEnrollment(e)}
                                            style={{
                                                padding: '12px 14px', borderRadius: 10, border: '1px solid',
                                                borderColor: selectedEnrollment?._id === e._id ? '#6366f1' : 'var(--border)',
                                                background: selectedEnrollment?._id === e._id ? 'rgba(99,102,241,0.04)' : 'var(--bg-surface)',
                                                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{e.academicYear}</span>
                                                <span style={{ fontSize: '0.70rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-muted)', textTransform: 'uppercase' }}>{e.status}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {typeof e.academicClassId === 'object' ? (e.academicClassId as any).templateId?.grade : 'Course Details'}
                                            </div>
                                            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance</div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: (e.outstandingBalance || 0) > 0 ? '#ef4444' : '#10b981' }}>
                                                        {formatCurrency(e.outstandingBalance || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Right Panel: Ledger Entries */}
                <div>
                    {!selectedEnrollment ? (
                        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text-muted)' }}>
                            <Receipt size={48} strokeWidth={1} />
                            <p>Select a student and enrollment to view ledger.</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Transaction History</h3>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Detailed ledger for academic year {selectedEnrollment.academicYear}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OUTSTANDING BALANCE</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: balance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(balance)}</div>
                                    </div>
                                    {canConcession && selectedEnrollment?.status === 'ONGOING' && selectedEnrollment?.concessionType === 'NONE' && (
                                        <button
                                            className="btn-secondary"
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderColor: 'var(--warning)', color: 'var(--warning)' }}
                                            onClick={() => setShowConcessionModal(true)}
                                        >
                                            <Tag size={16} /> Apply Concession
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="table-container" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date & Time</th>
                                            <th>Reference</th>
                                            <th>Ref Type</th>
                                            <th>Processed By</th>
                                            <th style={{ textAlign: 'right' }}>Credit</th>
                                            <th style={{ textAlign: 'right' }}>Debit</th>
                                            <th className="no-print" style={{ textAlign: 'center' }}>Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingLedger ? (
                                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading ledger entries...</td></tr>
                                        ) : ledger.length === 0 ? (
                                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No transactions recorded yet.</td></tr>
                                        ) : (
                                            ledger.map((entry) => (
                                                <tr key={entry._id}>
                                                    <td style={{ fontSize: '0.8125rem' }}>
                                                        <div style={{ fontWeight: 500 }}>{format(new Date(entry.createdAt), 'dd MMM yyyy')}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{format(new Date(entry.createdAt), 'hh:mm a')}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                                            <TruncatedText text={entry.description} maxWidth="180px" modalTitle="Transaction Description" />
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                            <TruncatedText text={`ID: ${entry.referenceId}`} maxWidth="120px" modalTitle="Reference ID" />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                                                            background: entry.referenceType === 'PAYMENT' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                                                            color: entry.referenceType === 'PAYMENT' ? '#10b981' : '#6366f1'
                                                        }}>
                                                            {entry.referenceType}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                                                            {(entry as any).createdBy?.name || (entry as any).createdBy?.firstName || 'System'}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981', background: entry.type === 'CREDIT' ? 'rgba(16,185,129,0.02)' : 'transparent' }}>
                                                        {entry.type === 'CREDIT' ? `₹${entry.amount.toLocaleString('en-IN')}` : '-'}
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444', background: entry.type === 'DEBIT' ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                                                        {entry.type === 'DEBIT' ? `₹${entry.amount.toLocaleString('en-IN')}` : '-'}
                                                    </td>
                                                    <td className="no-print" style={{ textAlign: 'center' }}>
                                                        {entry.referenceType === 'PAYMENT' ? (
                                                            <button
                                                                onClick={() => fetchAndShowReceipt(entry.referenceId)}
                                                                title="Download/Print Receipt"
                                                                style={{
                                                                    padding: 6, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)',
                                                                    cursor: 'pointer', color: '#6366f1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                                }}
                                                            >
                                                                <Download size={15} />
                                                            </button>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Modal for Receipt Display */}
            <Modal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
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

            {/* Concession Modal */}
            <AnimatePresence>
                {showConcessionModal && selectedEnrollment && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ zIndex: 1100 }}>
                        <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 24, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                Apply Concession
                            </h3>
                            <div style={{ marginBottom: 20, padding: 12, background: 'var(--bg-subtle)', borderRadius: 12, fontSize: '0.875rem' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Enrollment for:</div>
                                <div style={{ fontWeight: 700 }}>{selectedEnrollment.academicYear}</div>
                                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Current Net Fee:</span>
                                    <strong style={{ color: 'var(--accent)' }}>{formatCurrency(selectedEnrollment.netFee)}</strong>
                                </div>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const type = formData.get('concessionType') as 'PERCENTAGE' | 'FLAT';
                                const value = parseFloat(formData.get('concessionValue') as string);
                                const reason = formData.get('reason') as string || 'Not specified';

                                if (!value || value <= 0) {
                                    toast.error('Please enter a valid concession value');
                                    return;
                                }

                                applyConcessionMutation.mutate({ concessionType: type, concessionValue: value, reason });
                            }}>
                                <div style={{ marginBottom: 16 }}>
                                    <label className="form-label">Concession Type *</label>
                                    <select name="concessionType" className="form-select" defaultValue="PERCENTAGE">
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FLAT">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label className="form-label">Value *</label>
                                    <input name="concessionValue" type="number" step="0.01" className="form-input" placeholder="e.g. 10 for 10% or 5000 for ₹5000" required />
                                </div>
                                <div style={{ marginBottom: 24 }}>
                                    <label className="form-label">Reason (Optional)</label>
                                    <textarea name="reason" className="form-input" rows={3} placeholder="Optional reason for concession" />
                                </div>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowConcessionModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={applyConcessionMutation.isPending}>
                                        {applyConcessionMutation.isPending ? 'Applying...' : 'Apply Concession'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
