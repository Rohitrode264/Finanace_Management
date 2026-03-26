import { useState } from 'react';
import apiClient from '../../api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Tag, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import { enrollmentService } from '../../api/services/enrollment.service';
import { studentsService } from '../../api/services/students.service';
import { classesService } from '../../api/services/classes.service';
import { categoryService } from '../../api/services/category.service';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { Enrollment, Student, AcademicClass, ClassTemplate } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const CURRENT_YEAR = `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`;

const concessionSchema = z.object({
    concessionType: z.enum(['PERCENTAGE', 'FLAT'] as const),
    concessionValue: z.number().positive('Value must be positive'),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
});
type ConcessionForm = z.infer<typeof concessionSchema>;

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    ONGOING: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    COMPLETED: { bg: 'var(--accent-light)', color: 'var(--accent)' },
    CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
};

export function EnrollmentsPage() {
    const qc = useQueryClient();

    // Ledger / All Enrollments state
    const [currentEnrollment, setCurrentEnrollment] = useState<(Enrollment & { outstandingBalance?: number }) | null>(null);
    const [showConcessionForm, setShowConcessionForm] = useState(false);

    // Ledger / All Enrollments state
    const [ledgerSkip, setLedgerSkip] = useState(0);
    const LEDGER_LIMIT = 10;
    const [ledgerSearch, setLedgerSearch] = useState('');
    const [program, setProgram] = useState('');
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

    const { data: catRes } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.list(),
    });
    const categories = catRes?.data?.data || [];

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

    const { register: regConcession, handleSubmit: hsConcession, formState: { errors: cErrors }, reset: resetConcession } = useForm<ConcessionForm>({
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
                                <select
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
                                </select>
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
                                                        <div style={{ fontWeight: 600 }}>{student?.firstName} {student?.lastName}</div>
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
                            Enrolled: <strong>{format(new Date(currentEnrollment.createdAt), 'dd MMM yyyy')}</strong>
                        </div>

                        {canConcession && currentEnrollment.status === 'ONGOING' && currentEnrollment.concessionType === 'NONE' && (
                            <button className="btn-secondary" onClick={() => setShowConcessionForm(true)}>
                                <Tag size={14} /> Apply Concession
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
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEnrollForm(false)}>
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
                                                        Installment {ip.installmentNo}: {formatCurrency(ip.amount)} — due {format(new Date(ip.dueDate), 'dd MMM yyyy')}
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

            {/* Concession Modal */}
            <AnimatePresence>
                {showConcessionForm && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConcessionForm(false)}>
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
                                    <input {...regConcession('concessionValue', { valueAsNumber: true })} type="number" step="0.01" className={`form-input ${cErrors.concessionValue ? 'error' : ''}`} placeholder="e.g. 10 for 10% or 5000 for ₹5000" />
                                    {cErrors.concessionValue && <p className="form-error">{cErrors.concessionValue.message}</p>}
                                </div>
                                <div style={{ marginBottom: 24 }}>
                                    <label className="form-label">Reason *</label>
                                    <textarea {...regConcession('reason')} className={`form-input ${cErrors.reason ? 'error' : ''}`} rows={3} placeholder="Reason for concession (min 10 chars)" />
                                    {cErrors.reason && <p className="form-error">{cErrors.reason.message}</p>}
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
