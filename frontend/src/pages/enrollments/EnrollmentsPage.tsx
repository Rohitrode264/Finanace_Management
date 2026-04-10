import { useState } from 'react';
import apiClient from '../../api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Tag, Search, X, ChevronLeft, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import { enrollmentService } from '../../api/services/enrollment.service';
import { studentsService } from '../../api/services/students.service';
import { classesService } from '../../api/services/classes.service';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';
import { TruncatedText } from '../../components/ui/TruncatedText';
import toast from 'react-hot-toast';
import type { Enrollment, Student, AcademicClass, ClassTemplate } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const CURRENT_YEAR = `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`;

const concessionSchema = z.object({
    concessionType: z.enum(['PERCENTAGE', 'FLAT'] as const),
    concessionValue: z.number().positive('Value must be positive'),
    reason: z.string().optional(),
});
type ConcessionForm = z.infer<typeof concessionSchema>;

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    ONGOING: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    COMPLETED: { bg: 'var(--accent-light)', color: 'var(--accent)' },
    CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
};

export function EnrollmentsPage() {
    const qc = useQueryClient();

    // Helper for safe date formatting
    const safeFormatDate = (date: any, formatStr: string = 'dd MMM yyyy') => {
        try {
            if (!date) return 'N/A';
            const d = new Date(date);
            if (isNaN(d.getTime())) return 'N/A';
            return format(d, formatStr);
        } catch (e) {
            return 'N/A';
        }
    };

    // Ledger / All Enrollments state
    const [currentEnrollment, setCurrentEnrollment] = useState<(Enrollment & { outstandingBalance?: number }) | null>(null);
    
    // Helper for numeric inputs with react-hook-form
    const registerNumeric = (name: any, setValue: any) => ({
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '');
            const parts = raw.split('.');
            const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
            setValue(name, parseFloat(cleaned) || 0);
        }
    });

    const [showConcessionForm, setShowConcessionForm] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferTargetClassId, setTransferTargetClassId] = useState('');
    const [transferReason, setTransferReason] = useState('');
    const [transferConcessionType, setTransferConcessionType] = useState<'NONE' | 'PERCENTAGE' | 'FLAT'>('NONE');
    const [transferConcessionValue, setTransferConcessionValue] = useState<string>('0');
    const [changeConcession, setChangeConcession] = useState(false);

    // Ledger / All Enrollments state
    const [ledgerSkip, setLedgerSkip] = useState(0);
    const LEDGER_LIMIT = 10;
    const [ledgerSearch, setLedgerSearch] = useState('');
    const [program] = useState('');
    const dLedgerSearch = useDebounce(ledgerSearch, 400);

    // New Enrollment form state  
    const [showEnrollForm, setShowEnrollForm] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [enrollYear, setEnrollYear] = useState(CURRENT_YEAR);
    const [selectedClass, setSelectedClass] = useState<AcademicClass | null>(null);
    const dStudentSearch = useDebounce(studentSearch, 400);

    const canCreate = usePermission('CREATE_ENROLLMENT');
    const canConcession = usePermission('APPLY_CONCESSION');
    const canTransfer = usePermission('TRANSFER_ENROLLMENT');

    // Student search results
    // Student search results for new enrollment
    const { data: studentsRes, isLoading: sLoading } = useQuery({
        queryKey: ['enroll-student-search', dStudentSearch],
        queryFn: () => studentsService.list({ search: dStudentSearch, limit: 8 }),
        enabled: dStudentSearch.length >= 2 && showEnrollForm && !selectedStudent,
    });

    // Ledger student search
    const { data: ledgerStudentsRes } = useQuery({
        queryKey: ['ledger-student-search', dLedgerSearch],
        queryFn: () => studentsService.list({ search: dLedgerSearch, limit: 5 }),
        enabled: dLedgerSearch.length >= 2,
    });

    // Classes by year (for dropdown after student selected)
    const { data: classesRes } = useQuery({
        queryKey: ['classes-for-enroll', enrollYear],
        queryFn: () => classesService.listClasses(enrollYear),
        enabled: showEnrollForm && !!selectedStudent && enrollYear.length >= 6,
    });

    // All Enrollments / Ledger list
    const { data: allEnrollmentsRes, isLoading: ledgerLoading } = useQuery({
        queryKey: ['all-enrollments', ledgerSkip, program],
        queryFn: () => enrollmentService.list({ limit: LEDGER_LIMIT, skip: ledgerSkip, program: program || undefined }),
    });

    const students: Student[] = (studentsRes?.data?.data as any)?.students ?? [];
    const ledgerStudents: Student[] = (ledgerStudentsRes?.data?.data as any)?.students ?? [];
    const classes: AcademicClass[] = (classesRes?.data?.data as AcademicClass[] | undefined) ?? [];
    const allEnrollments: (Enrollment & { outstandingBalance?: number })[] = (allEnrollmentsRes?.data?.data as any) ?? [];

    // Classes for transfer — same academic year as current enrollment, excluding current class
    const { data: transferClassesRes } = useQuery({
        queryKey: ['transfer-classes', currentEnrollment?.academicYear],
        queryFn: () => classesService.listClasses(currentEnrollment!.academicYear),
        enabled: !!currentEnrollment && showTransferModal,
    });
    const transferClasses: AcademicClass[] = ((transferClassesRes?.data?.data as AcademicClass[] | undefined) ?? [])
        .filter(c => c._id !== (currentEnrollment?.academicClassId as any)?._id && c._id !== (currentEnrollment?.academicClassId as any));

    const lookupMutation = useMutation({
        mutationFn: (id: string) => enrollmentService.getById(id),
        onSuccess: (res) => {
            const e = res.data?.data;
            if (e) setCurrentEnrollment(e);
            else toast.error('Enrollment not found');
        },
        onError: () => toast.error('Could not find enrollment. Check the ID.'),
    });

    const enrollMutation = useMutation({
        mutationFn: () => {
            if (!selectedStudent || !selectedClass) throw new Error('Select a student and class');
            return enrollmentService.enroll({
                studentId: selectedStudent._id,
                academicClassId: selectedClass._id,
            });
        },
        onSuccess: (res) => {
            const e = res.data?.data;
            if (e) setCurrentEnrollment(e);
            toast.success('Student enrolled successfully');
            setShowEnrollForm(false);
            setSelectedStudent(null);
            setSelectedClass(null);
            setStudentSearch('');
            qc.invalidateQueries({ queryKey: ['students'] });
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Enrollment failed'),
    });

    const concessionMutation = useMutation({
        mutationFn: (d: ConcessionForm) =>
            enrollmentService.applyConcession(currentEnrollment!._id, d),
        onSuccess: (res) => {
            const amount = (res.data?.data as any)?.concessionAmount;
            toast.success(`Concession of ${formatCurrency(amount)} applied`);
            lookupMutation.mutate(currentEnrollment!._id);
            resetConcession();
            setShowConcessionForm(false);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to apply concession'),
    });

    const transferMutation = useMutation({
        mutationFn: () => {
            return enrollmentService.transfer(currentEnrollment!._id, {
                targetClassId: transferTargetClassId,
                reason: transferReason || undefined,
                concessionType: changeConcession ? transferConcessionType : undefined,
                concessionValue: changeConcession ? parseFloat(transferConcessionValue) : undefined,
            });
        },
        onSuccess: (res) => {
            const d = res.data?.data;
            toast.success(
                `Transfer successful! ₹${d?.amountCarriedOver?.toLocaleString('en-IN') ?? 0} carried over to new enrollment.`
            );
            qc.invalidateQueries({ queryKey: ['all-enrollments'] });
            setShowTransferModal(false);
            setTransferTargetClassId('');
            setTransferReason('');
            if (d?.newEnrollment) {
                // Navigate to new enrollment detail
                enrollmentService.getById(d.newEnrollment._id).then(r => {
                    if (r.data?.data) setCurrentEnrollment(r.data.data);
                });
            }
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Transfer failed'),
    });

    const { register: regConcession, handleSubmit: hsConcession, formState: { errors: cErrors }, reset: resetConcession, setValue: setConcessionValue } = useForm<ConcessionForm>({
        resolver: zodResolver(concessionSchema),
        defaultValues: { concessionType: 'PERCENTAGE' },
    });

    const templateLabel = (cls: AcademicClass) => {
        const t = typeof cls.templateId === 'object' ? cls.templateId as ClassTemplate : null;
        if (t) return `Class ${t.grade}${t.stream ? ` – ${t.stream}` : ''} (${t.board}) — Section ${cls.section}`;
        return `Class ID: ${cls._id} — Section ${cls.section}`;
    };

    return (
        <div>
            <PageHeader
                title="Enrollment Management"
                subtitle="Enroll students in classes, view enrollment details, and manage concessions."
                actions={canCreate ? (
                    <button className="btn-primary" onClick={() => { setShowEnrollForm(true); setSelectedStudent(null); setSelectedClass(null); setStudentSearch(''); }}>
                        <BookOpen size={15} /> New Enrollment
                    </button>
                ) : undefined}
            />

            {/* Main Content Area */}
            {!currentEnrollment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Full Ledger & Enrollments</h3>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {/* <select
                                    value={program}
                                    onChange={(e) => { setProgram(e.target.value); setLedgerSkip(0); }}
                                    className="form-select"
                                    style={{ width: 140 }}
                                >
                                    <option value="">All Programs</option>
                                    {categories.map((c: any) => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                    <option value="Other">Other</option>
                                </select> */}
                                <div style={{ position: 'relative', width: 300 }}>
                                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        value={ledgerSearch}
                                        onChange={e => setLedgerSearch(e.target.value)}
                                        className="form-input"
                                        placeholder="Search student to view ledger..."
                                        style={{ paddingLeft: 36 }}
                                    />
                                    {dLedgerSearch.length >= 2 && ledgerStudents.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                            {ledgerStudents.map(s => (
                                                <button
                                                    key={s._id}
                                                    style={{ width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}
                                                    onClick={() => {
                                                        apiClient.get(`/enrollments/student/${s._id}`).then((res: any) => {
                                                            const enrs = res.data?.data;
                                                            if (enrs && enrs.length > 0) {
                                                                setCurrentEnrollment(enrs[0]);
                                                            } else {
                                                                toast.error('No enrollments found for student');
                                                            }
                                                            setLedgerSearch('');
                                                        });
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.admissionNumber} · {s.phone}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Enrollments Table */}
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Enrollment ID</th>
                                        <th>Student</th>
                                        <th>Year / Class</th>
                                        <th style={{ textAlign: 'right' }}>Total Fee</th>
                                        <th style={{ textAlign: 'right' }}>Outstanding</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledgerLoading ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Loading ledger...</td></tr>
                                    ) : allEnrollments.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No enrollments found.</td></tr>
                                    ) : (
                                        allEnrollments.map(e => {
                                            const student = e.studentId as unknown as Student;
                                            const academicClass = e.academicClassId as unknown as AcademicClass;
                                            const template = (academicClass?.templateId as unknown as ClassTemplate);
                                            return (
                                                <tr key={e._id}>
                                                    <td><code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e._id.toString().slice(-6)}</code></td>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>
                                                            <TruncatedText text={`${student?.firstName} ${student?.lastName}`} maxWidth="150px" modalTitle="Student Name" />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '0.8125rem' }}>{e.academicYear}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {template ? `Class ${template.grade} (${template.board})` : 'Unknown Class'}
                                                        </div>
                                                    </td>
                                                    <td className="financial-value">{formatCurrency(e.netFee)}</td>
                                                    <td className="financial-value" style={{ color: (e.outstandingBalance ?? 0) > 0 ? '#ef4444' : '#10b981' }}>
                                                        {formatCurrency(e.outstandingBalance ?? 0)}
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                                                            ...STATUS_STYLE[e.status],
                                                        }}>
                                                            {e.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => setCurrentEnrollment(e)}>
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, gap: 8 }}>
                            <button className="btn-secondary" onClick={() => setLedgerSkip(s => Math.max(0, s - LEDGER_LIMIT))} disabled={ledgerSkip === 0} style={{ padding: '6px 12px' }}>
                                <ChevronLeft size={14} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Page {Math.floor(ledgerSkip / LEDGER_LIMIT) + 1}</span>
                            <button className="btn-secondary" onClick={() => setLedgerSkip(s => s + LEDGER_LIMIT)} disabled={allEnrollments.length < LEDGER_LIMIT} style={{ padding: '6px 12px' }}>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enrollment Detail */}
            {currentEnrollment && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Enrollment Details</h3>
                                <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentEnrollment._id}</code>
                            </div>
                            <span style={{
                                padding: '4px 12px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 700,
                                ...STATUS_STYLE[currentEnrollment.status],
                            }}>
                                {currentEnrollment.status}
                            </span>
                        </div>

                        <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, marginBottom: 24 }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Information</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: '0.875rem' }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong style={{ marginLeft: 4 }}>{(currentEnrollment.studentId as unknown as Student)?.firstName} {(currentEnrollment.studentId as unknown as Student)?.lastName}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <strong style={{ marginLeft: 4 }}>{(currentEnrollment.studentId as unknown as Student)?.phone}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Father:</span> <strong style={{ marginLeft: 4 }}>{(currentEnrollment.studentId as unknown as Student)?.fatherName}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Mother:</span> <strong style={{ marginLeft: 4 }}>{(currentEnrollment.studentId as unknown as Student)?.motherName}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Admission No:</span> <strong style={{ marginLeft: 4 }}>{(currentEnrollment.studentId as unknown as Student)?.admissionNumber}</strong></div>
                                {(currentEnrollment.studentId as unknown as Student)?.address?.city && (
                                    <div><span style={{ color: 'var(--text-muted)' }}>City:</span> <strong style={{ marginLeft: 4 }}>{(currentEnrollment.studentId as unknown as Student)?.address?.city}</strong></div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                            {[
                                { label: 'Original Fee', value: formatCurrency(currentEnrollment.totalFee), color: 'var(--text-muted)' },
                                {
                                    label: 'Concession / Discount',
                                    value: `- ${formatCurrency(currentEnrollment.totalFee - currentEnrollment.netFee)}`,
                                    color: '#f59e0b'
                                },
                                { label: 'Final Net Payable', value: formatCurrency(currentEnrollment.netFee), color: 'var(--accent)' },
                                {
                                    label: 'Total Paid',
                                    value: formatCurrency(currentEnrollment.netFee - (currentEnrollment.outstandingBalance ?? 0)),
                                    color: '#10b981'
                                },
                                { label: 'Balance Outstanding', value: formatCurrency(currentEnrollment.outstandingBalance ?? 0), color: '#ef4444' },
                            ].map(r => (
                                <div key={r.label} style={{ padding: 14, background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>{r.label}</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: r.color }}>{r.value}</div>
                                </div>
                            ))}
                        </div>

                        {currentEnrollment.concessionType !== 'NONE' && (
                            <div style={{ padding: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, marginBottom: 16 }}>
                                <Tag size={14} style={{ display: 'inline', marginRight: 6 }} color="#f59e0b" />
                                <strong style={{ color: '#f59e0b' }}>Concession Applied:</strong>{' '}
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {currentEnrollment.concessionType === 'PERCENTAGE'
                                        ? `${currentEnrollment.concessionValue}% discount`
                                        : `Flat ₹${currentEnrollment.concessionValue} discount`}
                                </span>
                            </div>
                        )}

                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                            Academic Year: <strong>{currentEnrollment.academicYear}</strong> ·
                            Enrolled: <strong>{safeFormatDate(currentEnrollment.createdAt)}</strong>
                        </div>

                        {canConcession && currentEnrollment.status === 'ONGOING' && currentEnrollment.concessionType === 'NONE' && (
                            <button className="btn-secondary" onClick={() => setShowConcessionForm(true)}>
                                <Tag size={14} /> Apply Concession
                            </button>
                        )}
                        {canTransfer && currentEnrollment.status === 'ONGOING' && (
                            <button
                                className="btn-secondary"
                                style={{ marginLeft: canConcession && currentEnrollment.concessionType === 'NONE' ? 8 : 0 }}
                                onClick={() => { 
                                    setShowTransferModal(true); 
                                    setTransferTargetClassId(''); 
                                    setTransferReason('');
                                    setTransferConcessionType(currentEnrollment.concessionType as any || 'NONE');
                                    setTransferConcessionValue(String(currentEnrollment.concessionValue || 0));
                                    setChangeConcession(false);
                                }}
                            >
                                <ArrowRightLeft size={14} /> Transfer Course
                            </button>
                        )}
                        <button className="btn-secondary" style={{ marginTop: 24, padding: '8px 16px' }} onClick={() => setCurrentEnrollment(null)}>
                            ← Back to Ledger
                        </button>
                    </div>
                </motion.div>
            )}

            {/* New Enrollment Modal */}
            <AnimatePresence>
                {showEnrollForm && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: 560 }}
                        >
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 24, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                New Enrollment
                            </h3>

                            {/* Step 1: Student Search */}
                            <div style={{ marginBottom: 20 }}>
                                <label className="form-label">Student *</label>
                                {selectedStudent ? (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                        background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                    }}>
                                        <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 }}>
                                            {selectedStudent.firstName.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedStudent.firstName} {selectedStudent.lastName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedStudent.admissionNumber} · {selectedStudent.phone}</div>
                                        </div>
                                        <button onClick={() => { setSelectedStudent(null); setSelectedClass(null); setStudentSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input
                                                autoFocus
                                                value={studentSearch}
                                                onChange={e => setStudentSearch(e.target.value)}
                                                className="form-input"
                                                placeholder="Search by name or admission number..."
                                                style={{ paddingLeft: 36 }}
                                            />
                                        </div>
                                        {dStudentSearch.length >= 2 && (
                                            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginTop: 4 }}>
                                                {sLoading ? (
                                                    <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Searching...</div>
                                                ) : students.length === 0 ? (
                                                    <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No students found</div>
                                                ) : (
                                                    students.map(s => (
                                                        <button
                                                            key={s._id}
                                                            type="button"
                                                            onClick={() => { setSelectedStudent(s); setStudentSearch(''); }}
                                                            style={{
                                                                width: '100%', padding: '10px 14px', border: 'none',
                                                                borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)',
                                                                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                                                            }}
                                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                                                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                                                        >
                                                            <div style={{ width: 32, height: 32, background: 'var(--bg-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8125rem', flexShrink: 0 }}>
                                                                {s.firstName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{s.firstName} {s.lastName}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.admissionNumber} · {s.phone}</div>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Academic Year + Class Selection */}
                            {selectedStudent && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label className="form-label">Academic Year *</label>
                                        <input
                                            value={enrollYear}
                                            onChange={e => { setEnrollYear(e.target.value); setSelectedClass(null); }}
                                            className="form-input"
                                            placeholder="e.g. 2024-25"
                                        />
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <label className="form-label">Academic Class *</label>
                                        <select
                                            value={selectedClass?._id ?? ''}
                                            onChange={e => {
                                                const cls = classes.find(c => c._id === e.target.value);
                                                setSelectedClass(cls ?? null);
                                            }}
                                            className="form-select"
                                        >
                                            <option value="">— Select a class —</option>
                                            {classes.map(c => (
                                                <option key={c._id} value={c._id}>{templateLabel(c)} — ₹{c.totalFee.toLocaleString()}</option>
                                            ))}
                                        </select>
                                        {classes.length === 0 && enrollYear.length >= 6 && (
                                            <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>
                                                No active classes for {enrollYear}. Create classes first.
                                            </p>
                                        )}
                                    </div>

                                    {/* Fee preview */}
                                    {selectedClass && (
                                        <div style={{ padding: 14, background: 'var(--bg-subtle)', borderRadius: 10, marginBottom: 20, fontSize: '0.875rem' }}>
                                            <div style={{ fontWeight: 700, marginBottom: 8 }}>Fee Structure Preview</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                <div><span style={{ color: 'var(--text-muted)' }}>Total Fee: </span><strong>{formatCurrency(selectedClass.totalFee)}</strong></div>
                                                <div><span style={{ color: 'var(--text-muted)' }}>Installments: </span><strong>{selectedClass.installmentPlan.length}</strong></div>
                                            </div>
                                            <div style={{ marginTop: 8 }}>
                                                {selectedClass.installmentPlan.map(ip => (
                                                    <div key={ip.installmentNo} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                                        Installment {ip.installmentNo}: {formatCurrency(ip.amount)} — due {safeFormatDate(ip.dueDate)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => { setShowEnrollForm(false); setSelectedStudent(null); setSelectedClass(null); }}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    disabled={!selectedStudent || !selectedClass || enrollMutation.isPending}
                                    onClick={() => enrollMutation.mutate()}
                                >
                                    {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transfer Course Modal */}
            <AnimatePresence>
                {showTransferModal && currentEnrollment && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: 580 }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <ArrowRightLeft size={18} color="#fff" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Transfer Course</h3>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                                        Move student to a different class. Fees paid on current enrollment will be carried over.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowTransferModal(false)}
                                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* From Enrollment Info */}
                            <div style={{
                                padding: '12px 16px', background: 'rgba(239,68,68,0.06)',
                                border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, marginBottom: 16,
                                fontSize: '0.8125rem',
                            }}>
                                <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Current Enrollment (will be CANCELLED)</div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    {(() => {
                                        const cls = currentEnrollment.academicClassId as any as AcademicClass;
                                        const t = typeof cls?.templateId === 'object' ? cls.templateId as ClassTemplate : null;
                                        if (t) return `Class ${t.grade}${t.stream ? ` – ${t.stream}` : ''} (${t.board}) — Sec ${cls.section}`;
                                        return `Enrollment ID: ${currentEnrollment._id.slice(-6)}`;
                                    })()}
                                    {' '}· Year: <strong>{currentEnrollment.academicYear}</strong>
                                </div>
                                <div style={{ marginTop: 6, display: 'flex', gap: 24 }}>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Net Fee: </span><strong>{formatCurrency(currentEnrollment.netFee)}</strong></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Already Paid: </span>
                                        <strong style={{ color: '#10b981' }}>
                                            {formatCurrency(currentEnrollment.netFee - (currentEnrollment.outstandingBalance ?? 0))}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <ArrowRightLeft size={20} color="#6366f1" style={{ transform: 'rotate(90deg)' }} />
                            </div>

                            {/* Target Class Selection */}
                            <div style={{ marginBottom: 16 }}>
                                <label className="form-label">Target Class *</label>
                                <select
                                    value={transferTargetClassId}
                                    onChange={e => setTransferTargetClassId(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">— Select target class —</option>
                                    {transferClasses.map(c => {
                                        const t = typeof c.templateId === 'object' ? c.templateId as ClassTemplate : null;
                                        const label = t
                                            ? `Class ${t.grade}${t.stream ? ` – ${t.stream}` : ''} (${t.board}) — Sec ${c.section} · ₹${c.totalFee.toLocaleString('en-IN')}`
                                            : `Class ID: ${c._id} · ₹${c.totalFee.toLocaleString('en-IN')}`;
                                        return <option key={c._id} value={c._id}>{label}</option>;
                                    })}
                                </select>
                                {transferClasses.length === 0 && (
                                    <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>
                                        No other active classes found for academic year {currentEnrollment.academicYear}.
                                    </p>
                                )}
                            </div>

                            {/* Fee carry-over preview */}
                            {transferTargetClassId && (() => {
                                const targetCls = transferClasses.find(c => c._id === transferTargetClassId);
                                const alreadyPaid = currentEnrollment.netFee - (currentEnrollment.outstandingBalance ?? 0);
                                
                                // Calculate new concession amount
                                let cType = changeConcession ? transferConcessionType : (currentEnrollment.concessionType as any || 'NONE');
                                let cValString = changeConcession ? transferConcessionValue : String(currentEnrollment.concessionValue || 0);
                                let cVal = parseFloat(cValString) || 0;
                                
                                let newConcessionAmount = 0;
                                if (cType === 'PERCENTAGE' && targetCls) {
                                    newConcessionAmount = (targetCls.totalFee * cVal) / 100;
                                } else if (cType === 'FLAT') {
                                    newConcessionAmount = cVal;
                                }
                                
                                const newNetFee = (targetCls?.totalFee ?? 0) - newConcessionAmount;
                                const newOutstanding = Math.max(0, newNetFee - alreadyPaid);
                                
                                return targetCls ? (
                                    <div style={{
                                        padding: '12px 16px', background: 'rgba(99,102,241,0.06)',
                                        border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, marginBottom: 16,
                                        fontSize: '0.8125rem',
                                    }}>
                                        <div style={{ fontWeight: 700, color: '#6366f1', marginBottom: 8 }}>Transfer Summary</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            <div><span style={{ color: 'var(--text-muted)' }}>New Class Fee:</span> <strong>{formatCurrency(targetCls.totalFee)}</strong></div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>Amount Carried Over:</span> <strong style={{ color: '#10b981' }}>{formatCurrency(alreadyPaid)}</strong></div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>New Concession:</span> <strong style={{ color: '#f59e0b' }}>-{formatCurrency(newConcessionAmount)}</strong></div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>New Net Fee:</span> <strong>{formatCurrency(newNetFee)}</strong></div>
                                            <div style={{ gridColumn: '1 / -1', marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(99,102,241,0.1)' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>New Balance After Transfer:</span>{' '}
                                                <strong style={{ color: newOutstanding > 0 ? '#ef4444' : '#10b981', fontSize: '1rem' }}>{formatCurrency(newOutstanding)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            {/* Concession Options */}
                            <div style={{ 
                                marginBottom: 20, 
                                padding: 16, 
                                background: changeConcession ? 'rgba(99,102,241,0.04)' : 'transparent',
                                border: `1px ${changeConcession ? 'solid' : 'dashed'} ${changeConcession ? '#6366f1' : 'var(--border)'}`, 
                                borderRadius: 12,
                                transition: 'all 0.2s ease'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: changeConcession ? 16 : 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Tag size={16} color={changeConcession ? '#6366f1' : 'var(--text-muted)'} />
                                        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: changeConcession ? '#6366f1' : 'var(--text-primary)' }}>Concession / Discount</div>
                                    </div>
                                    <label style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 10, 
                                        cursor: 'pointer', 
                                        padding: '6px 12px', 
                                        background: changeConcession ? '#6366f1' : 'var(--bg-subtle)',
                                        color: changeConcession ? '#fff' : 'var(--text-secondary)',
                                        borderRadius: 20,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        transition: 'all 0.2s ease',
                                        boxShadow: changeConcession ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            checked={changeConcession} 
                                            onChange={(e) => setChangeConcession(e.target.checked)} 
                                            style={{ cursor: 'pointer', accentColor: '#fff', width: 14, height: 14 }}
                                        />
                                        {changeConcession ? 'MODIFIED' : 'CHANGE ?'}
                                    </label>
                                </div>

                                {!changeConcession ? (
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                        Current: <strong>{currentEnrollment.concessionType === 'NONE' ? 'None' : `${currentEnrollment.concessionType} (${currentEnrollment.concessionValue}${currentEnrollment.concessionType === 'PERCENTAGE' ? '%' : '₹'})`}</strong>
                                        <span style={{ marginLeft: 8 }}>(Will be applied to new class fee by default)</span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>New Type</label>
                                            <select 
                                                className="form-select" 
                                                value={transferConcessionType}
                                                onChange={(e) => setTransferConcessionType(e.target.value as any)}
                                            >
                                                <option value="NONE">None</option>
                                                <option value="PERCENTAGE">Percentage (%)</option>
                                                <option value="FLAT">Flat Amount (₹)</option>
                                            </select>
                                        </div>
                                        {transferConcessionType !== 'NONE' && (
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Value</label>
                                                <input 
                                                    type="text"
                                                    inputMode="numeric"
                                                    className="form-input" 
                                                    value={transferConcessionValue}
                                                    onChange={(e) => {
                                                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                                                        const parts = raw.split('.');
                                                        const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
                                                        setTransferConcessionValue(cleaned);
                                                    }}
                                                    placeholder="0"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Reason */}
                            <div style={{ marginBottom: 20 }}>
                                <label className="form-label">Reason for Transfer (optional)</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={transferReason}
                                    onChange={e => setTransferReason(e.target.value)}
                                    placeholder="e.g. Wrong class selected during admission, student requested change..."
                                />
                            </div>

                            {/* Warning */}
                            <div style={{
                                padding: '10px 14px', background: 'rgba(245,158,11,0.08)',
                                border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, marginBottom: 20,
                                fontSize: '0.8125rem', color: '#f59e0b',
                            }}>
                                ⚠️ <strong>This action is irreversible.</strong> The current enrollment will be permanently cancelled and a new one will be created in the selected class.
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button
                                    type="button" className="btn-secondary"
                                    onClick={() => { setShowTransferModal(false); setTransferTargetClassId(''); setTransferReason(''); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    disabled={!transferTargetClassId || transferMutation.isPending}
                                    onClick={() => transferMutation.mutate()}
                                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                                >
                                    {transferMutation.isPending ? 'Transferring...' : '⇄ Confirm Transfer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Concession Modal */}
            <AnimatePresence>
                {showConcessionForm && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 24, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                Apply Concession
                            </h3>
                            <form onSubmit={hsConcession(d => concessionMutation.mutate(d))}>
                                <div style={{ marginBottom: 16 }}>
                                    <label className="form-label">Concession Type *</label>
                                    <select {...regConcession('concessionType')} className="form-select">
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FLAT">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label className="form-label">Value *</label>
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        className={`form-input ${cErrors.concessionValue ? 'error' : ''}`} 
                                        placeholder="e.g. 10 for 10% or 5000 for ₹5000"
                                        {...regConcession('concessionValue')}
                                        onChange={registerNumeric('concessionValue', setConcessionValue).onChange}
                                    />
                                     {cErrors?.concessionValue && <p className="form-error">{cErrors.concessionValue.message}</p>}
                                </div>
                                <div style={{ marginBottom: 24 }}>
                                    <label className="form-label">Reason (Optional)</label>
                                    <textarea {...regConcession('reason')} className={`form-input ${cErrors.reason ? 'error' : ''}`} rows={3} placeholder="Optional reason for concession" />
                                     {cErrors?.reason && <p className="form-error">{cErrors.reason.message}</p>}
                                </div>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn-secondary" onClick={() => { setShowConcessionForm(false); resetConcession(); }}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={concessionMutation.isPending}>
                                        {concessionMutation.isPending ? 'Applying...' : 'Apply Concession'}
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
