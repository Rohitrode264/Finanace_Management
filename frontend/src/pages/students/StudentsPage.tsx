import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, X, BookOpen, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { usePermission } from '../../hooks/usePermission';
import { useDebounce } from '../../hooks/useDebounce';
import { studentsService } from '../../api/services/students.service';
import { categoryService } from '../../api/services/category.service';
import { enrollmentService } from '../../api/services/enrollment.service';
import { classesService } from '../../api/services/classes.service';
import apiClient from '../../api/client';
import type { Student, StudentStatus, AcademicClass, ClassTemplate, Enrollment } from '../../types';
import { formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

const CURRENT_YEAR = `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`;

const studentSchema = z.object({
    admissionNumber: z.string().min(3, 'Admission number must be at least 3 characters').max(20),
    firstName: z.string().min(1, 'First name required').max(100),
    lastName: z.string().min(1, 'Last name required').max(100),
    phone: z.string().min(10, "Father's phone must be 10 digits"),
    motherPhone: z.string().min(10, "Mother's phone must be 10 digits").optional().or(z.literal('')),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    fatherName: z.string().min(1, "Father's name required").max(100),
    motherName: z.string().min(1, "Mother's name required").max(100),
    program: z.string().optional(),
    schoolName: z.string().max(200).optional().or(z.literal('')),
    bloodGroup: z.string().optional(),
    address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
    }).optional(),
    history: z.object({
        previousSchool: z.string().optional(),
        percentage: z.string().optional(),
        yearPassout: z.string().optional(),
        extraNote: z.string().optional(),
    }).optional(),
});
type StudentForm = z.infer<typeof studentSchema>;

const STATUS_COLORS: Record<StudentStatus, { bg: string; color: string }> = {
    ACTIVE: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    DROPPED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    PASSED_OUT: { bg: 'var(--bg-muted)', color: 'var(--text-secondary)' },
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    ONGOING: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    COMPLETED: { bg: 'var(--accent-light)', color: 'var(--accent)' },
    CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
};

export function StudentsPage() {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [viewProfileDrawer, setViewProfileDrawer] = useState<boolean>(false);
    const [selectedStudentForView, setSelectedStudentForView] = useState<Student | null>(null);

    // Filter state
    const [search, setSearch] = useState('');
    const [program, setProgram] = useState('');
    const [skip, setSkip] = useState(0);
    const LIMIT = 12;
    const [showCreate, setShowCreate] = useState(false);
    const [confirmChange, setConfirmChange] = useState<{ student: Student; newStatus: StudentStatus } | null>(null);
    const dSearch = useDebounce(search);

    const [enrollYear] = useState(CURRENT_YEAR);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

    // Step 1: Student details form
    const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm<StudentForm>({
        resolver: zodResolver(studentSchema),
        defaultValues: { email: '', bloodGroup: '', phone: '', motherPhone: '', address: { street: '', city: '', state: '', zipCode: '' } }
    });

    useEffect(() => {
        if (showCreate) {
            studentsService.generateAdmissionId().then(res => {
                if (res.data?.data?.admissionId) {
                    reset({ ...getValues(), admissionNumber: res.data.data.admissionId });
                }
            }).catch(console.error);
        }
    }, [showCreate, reset, getValues]);

    // Step 2: Course Selection
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    // Step 3: Concession
    const [concessionType, setConcessionType] = useState<'NONE' | 'PERCENTAGE' | 'FLAT'>('NONE');
    const [concessionValue, setConcessionValue] = useState<number>(0);
    const [concessionReason, setConcessionReason] = useState<string>('');

    const canCreate = usePermission('CREATE_STUDENT');
    const canUpdate = usePermission('UPDATE_STUDENT');
    const canConcession = usePermission('APPLY_CONCESSION');

    const { data: classesRes } = useQuery({
        queryKey: ['classes-for-admission', enrollYear],
        queryFn: () => classesService.listClasses(enrollYear),
        enabled: showCreate,
    });
    const classes: AcademicClass[] = (classesRes?.data?.data as AcademicClass[] | undefined) ?? [];

    const { data: catRes } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.list(),
    });
    const categories = catRes?.data?.data || [];

    const { data: studentsRes, isLoading } = useQuery({
        queryKey: ['students', skip, dSearch, program],
        queryFn: () => studentsService.list({ limit: LIMIT, skip, search: dSearch || undefined, program: program || undefined }),
    });

    const students: Student[] = studentsRes?.data?.data?.students ?? [];
    const total: number = studentsRes?.data?.data?.total ?? 0;
    const totalPages = Math.ceil(total / LIMIT);
    const page = Math.floor(skip / LIMIT) + 1;

    const admissionMutation = useMutation({
        mutationFn: async (studentData: StudentForm) => {
            // 1. Create student
            const studentRes = await studentsService.create(studentData as any);
            const newStudentId = studentRes.data?.data?._id;
            if (!newStudentId) throw new Error('Failed to create student record');

            // 2. Enroll if class selected (optional but recommended)
            if (selectedClassId) {
                const enrollRes = await enrollmentService.enroll({
                    studentId: newStudentId,
                    academicClassId: selectedClassId,
                });
                const enrollmentId = enrollRes.data?.data?._id;

                // 3. Apply concession if selected
                if (enrollmentId && concessionType !== 'NONE' && concessionValue > 0) {
                    await enrollmentService.applyConcession(enrollmentId, {
                        concessionType: concessionType as 'PERCENTAGE' | 'FLAT',
                        concessionValue,
                        reason: concessionReason || 'Admissions standard concession',
                    });
                }
            }
            return newStudentId;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['students'] });
            toast.success('Admissions process completed successfully');
            closeWizard();
            setViewProfileDrawer(false);
            setSelectedStudentForView(null);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Admissions process failed midway'),
    });

    const closeWizard = () => {
        setShowCreate(false);
        setWizardStep(1);
        reset();
        setSelectedClassId('');
        setConcessionType('NONE');
        setConcessionValue(0);
        setConcessionReason('');
    };

    // Fetch enrollments for the currently viewed student profile
    const { data: profileEnrollmentsRes } = useQuery({
        queryKey: ['student-enrollments', selectedStudentForView?._id],
        queryFn: () => apiClient.get(`/enrollments/student/${selectedStudentForView?._id}`),
        enabled: viewProfileDrawer && !!selectedStudentForView,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const profileEnrollments: (Enrollment & { outstandingBalance?: number })[] = profileEnrollmentsRes?.data?.data || [];
    console.log("Current profile enrollments:", profileEnrollments.length);

    const handleWizardNext = () => {
        if (wizardStep === 1) {
            // Validate form without submitting
            handleSubmit(() => setWizardStep(2))();
        } else if (wizardStep === 2) {
            if (!selectedClassId) toast('You can skip course selection if needed later.', { icon: 'ℹ️' });
            setWizardStep(3);
        }
    };

    const templateLabel = (cls: AcademicClass) => {
        const t = typeof cls.templateId === 'object' ? cls.templateId as ClassTemplate : null;
        if (t) return `Class ${t.grade}${t.stream ? ` – ${t.stream}` : ''} (${t.board})`;
        return `Class ID: ${cls._id}`;
    };

    const statusMutation = useMutation({
        mutationFn: ({ student, newStatus }: { student: Student; newStatus: StudentStatus }) =>
            studentsService.updateStatus(student._id, newStatus),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['students'] });
            toast.success(`Student status changed to ${vars.newStatus}`);
            setConfirmChange(null);
        },
        onError: () => toast.error('Failed to update status'),
    });

    const handleViewStudent = (student: Student) => {
        setSelectedStudentForView(student);
        setViewProfileDrawer(true);
    };

    return (
        <div>
            <PageHeader
                title="Student Management"
                subtitle="Create, view, and manage student records in the system."
                actions={
                    <>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <SearchInput value={search} onChange={setSearch} placeholder="Search students..." />
                            <select
                                value={program}
                                onChange={(e) => { setProgram(e.target.value); setSkip(0); }}
                                className="form-select"
                                style={{ width: 140 }}
                            >
                                <option value="">All Programs</option>
                                {categories.map((c: any) => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        {canCreate && (
                            <button className="btn-primary" onClick={() => setShowCreate(true)}>
                                <Plus size={15} /> New Admission
                            </button>
                        )}
                    </>
                }
            />

            {/* Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student Details</th>
                            <th>Phone</th>
                            <th>Father / Mother</th>
                            <th>School</th>
                            <th>Blood Group</th>
                            <th>City</th>
                            <th>Status</th>
                            {canUpdate && <th style={{ textAlign: 'center' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: canUpdate ? 7 : 6 }).map((_, j) => (
                                        <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                                    ))}
                                </tr>
                            ))
                        ) : students.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No students found matching criteria.</td></tr>
                        ) : (
                            students.map((s) => {
                                const sc = STATUS_COLORS[s.status];
                                return (
                                    <tr
                                        key={s._id}
                                        style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                        onClick={() => handleViewStudent(s)}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-muted)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem'
                                                }}>
                                                    {s.firstName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.admissionNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{s.phone}</td>
                                        <td>
                                            <div style={{ fontSize: '0.8125rem' }}>{s.fatherName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.motherName}</div>
                                        </td>
                                        <td>{s.schoolName || '-'}</td>
                                        <td>{s.bloodGroup || '-'}</td>
                                        <td>{s.address?.city || '-'}</td>
                                        <td>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                                                background: sc.bg, color: sc.color,
                                            }}>
                                                {s.status}
                                            </span>
                                        </td>
                                        {canUpdate && (
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={s.status}
                                                        onChange={(e) => setConfirmChange({
                                                            student: s,
                                                            newStatus: e.target.value as StudentStatus,
                                                        })}
                                                        style={{
                                                            padding: '4px 8px', borderRadius: 6, fontSize: '0.8125rem',
                                                            border: '1px solid var(--border)', background: 'var(--bg-surface)',
                                                            color: 'var(--text-primary)', cursor: 'pointer',
                                                        }}
                                                    >
                                                        <option value="ACTIVE">Active</option>
                                                        <option value="DROPPED">Dropped</option>
                                                        <option value="PASSED_OUT">Passed Out</option>
                                                    </select>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Showing {students.length} of {total} students
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary" onClick={() => setSkip(s => Math.max(0, s - LIMIT))} disabled={skip === 0} style={{ padding: '6px 12px' }}>
                            <ChevronLeft size={14} />
                        </button>
                        <span style={{ padding: '6px 16px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600 }}>
                            {page} / {totalPages}
                        </span>
                        <button className="btn-secondary" onClick={() => setSkip(s => s + LIMIT)} disabled={skip + LIMIT >= total} style={{ padding: '6px 12px' }}>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Unified Admissions Wizard Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={closeWizard}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: 640 }}
                        >
                            <h3 style={{ fontSize: '1.375rem', fontWeight: 600, marginBottom: 8, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>New Admission</h3>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                                {[1, 2, 3].map(step => (
                                    <div key={step} style={{
                                        flex: 1, height: 4, borderRadius: 2,
                                        background: wizardStep >= step ? 'var(--accent)' : 'var(--bg-muted)'
                                    }} />
                                ))}
                            </div>

                            {/* STEP 1: Personal Details */}
                            {wizardStep === 1 && (
                                <form onSubmit={e => { e.preventDefault(); handleWizardNext(); }}>
                                    <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 16 }}>Step 1: Student Details</h4>
                                    <div className="form-grid" style={{ overflowY: 'auto', maxHeight: '50vh', paddingRight: 8 }}>
                                        <div>
                                            <label className="form-label">Admission Number *</label>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <input {...register('admissionNumber')} className={`form-input ${errors.admissionNumber ? 'error' : ''}`} placeholder="e.g. ADM-2024-0001" />
                                                <button type="button" className="btn-secondary" onClick={() => {
                                                    studentsService.generateAdmissionId().then(res => {
                                                        if (res.data?.data?.admissionId) {
                                                            reset({ ...getValues(), admissionNumber: res.data.data.admissionId });
                                                        }
                                                    });
                                                }} title="Auto-Generate">
                                                    ↻
                                                </button>
                                            </div>
                                            {errors.admissionNumber && <p className="form-error">{errors.admissionNumber.message}</p>}
                                        </div>
                                        <div>
                                            <label className="form-label">Blood Group</label>
                                            <select {...register('bloodGroup')} className={`form-input ${errors.bloodGroup ? 'error' : ''}`}>
                                                <option value="">Select...</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                            {errors.bloodGroup && <p className="form-error">{errors.bloodGroup.message}</p>}
                                        </div>
                                        <div>
                                            <label className="form-label">First Name *</label>
                                            <input {...register('firstName')} className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="First name" />
                                            {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                                        </div>
                                        <div>
                                            <label className="form-label">Last Name *</label>
                                            <input {...register('lastName')} className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Last name" />
                                            {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                                        </div>
                                        <div>
                                            <label className="form-label">Father's Phone *</label>
                                            <input {...register('phone')} className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="10-digit mobile number" />
                                            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                                        </div>
                                        <div>
                                            <label className="form-label">Mother's Phone</label>
                                            <input {...register('motherPhone')} className={`form-input ${errors.motherPhone ? 'error' : ''}`} placeholder="10-digit mobile number" />
                                            {errors.motherPhone && <p className="form-error">{errors.motherPhone.message}</p>}
                                        </div>
                                        <div>
                                            <label className="form-label">Email</label>
                                            <input {...register('email')} className={`form-input ${errors.email ? 'error' : ''}`} placeholder="Email address" />
                                            {errors.email && <p className="form-error">{errors.email.message}</p>}
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">School Name (Optional)</label>
                                            <input {...register('schoolName')} className="form-input" placeholder="Previous or current school name" />
                                        </div>
                                        <div>
                                            <label className="form-label">Father's Name *</label>
                                            <input {...register('fatherName')} className={`form-input ${errors.fatherName ? 'error' : ''}`} placeholder="Father's name" />
                                            {errors.fatherName && <p className="form-error">{errors.fatherName.message}</p>}
                                        </div>
                                        <div>
                                            <label className="form-label">Mother's Name *</label>
                                            <input {...register('motherName')} className={`form-input ${errors.motherName ? 'error' : ''}`} placeholder="Mother's name" />
                                            {errors.motherName && <p className="form-error">{errors.motherName.message}</p>}
                                        </div>
                                        <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                                            <h5 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-muted)' }}>Previous History (Optional)</h5>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Previous School Name</label>
                                            <input {...register('history.previousSchool')} className="form-input" placeholder="School where student studied previously" />
                                        </div>
                                        <div>
                                            <label className="form-label">Percentage (%) / Grade</label>
                                            <input {...register('history.percentage')} className="form-input" placeholder="e.g. 85%, A+" />
                                        </div>
                                        <div>
                                            <label className="form-label">Year of Passing</label>
                                            <input {...register('history.yearPassout')} className="form-input" placeholder="e.g. 2023" />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Additional Notes</label>
                                            <textarea {...register('history.extraNote')} className="form-input" rows={2} placeholder="Any extra info about history" />
                                        </div>

                                        <div>
                                            <label className="form-label">Program Category</label>
                                            <select {...register('program')} className={`form-select ${errors.program ? 'error' : ''}`}>
                                                <option value="">— Select a Program —</option>
                                                {categories.map((c: any) => (
                                                    <option key={c._id} value={c.name}>{c.name}</option>
                                                ))}
                                                <option value="Other">Other</option>
                                            </select>
                                            {errors.program && <p className="form-error">{errors.program.message}</p>}
                                        </div>
                                        <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                                            <h5 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-muted)' }}>Address Information</h5>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Street</label>
                                            <input {...register('address.street')} className="form-input" placeholder="House/Flat No, Street Name" />
                                        </div>
                                        <div>
                                            <label className="form-label">City</label>
                                            <input {...register('address.city')} className="form-input" placeholder="City" />
                                        </div>
                                        <div>
                                            <label className="form-label">State</label>
                                            <input {...register('address.state')} className="form-input" placeholder="State" />
                                        </div>
                                        <div>
                                            <label className="form-label">Zip/Pin Code</label>
                                            <input {...register('address.zipCode')} className="form-input" placeholder="Zip/Pin Code" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                                        <button type="button" className="btn-secondary" onClick={closeWizard}>Cancel</button>
                                        <button type="submit" className="btn-primary">Next: Course Selection →</button>
                                    </div>
                                </form>
                            )}

                            {/* STEP 2: Course Selection */}
                            {wizardStep === 2 && (
                                <div>
                                    <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 16 }}>Step 2: Assign Course ({enrollYear})</h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto', padding: '4px 0' }}>
                                        <label
                                            onClick={() => setSelectedClassId('')}
                                            style={{
                                                padding: '16px', border: `2px solid ${selectedClassId === '' ? 'var(--accent)' : 'var(--border)'}`,
                                                borderRadius: 12, cursor: 'pointer', background: selectedClassId === '' ? 'var(--bg-subtle)' : 'transparent',
                                                display: 'flex', alignItems: 'center', gap: 16,
                                            }}
                                        >
                                            <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid', borderColor: selectedClassId === '' ? 'var(--accent)' : 'var(--border)', padding: 3 }}>
                                                {selectedClassId === '' && <div style={{ width: '100%', height: '100%', background: 'var(--accent)', borderRadius: '50%' }} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Skip Course Assignment</div>
                                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Only register the student profile. Can enroll later.</div>
                                            </div>
                                        </label>

                                        {classes.map(c => (
                                            <label
                                                key={c._id}
                                                onClick={() => setSelectedClassId(c._id)}
                                                style={{
                                                    padding: '16px', border: `2px solid ${selectedClassId === c._id ? 'var(--accent)' : 'var(--border)'}`,
                                                    borderRadius: 12, cursor: 'pointer', background: selectedClassId === c._id ? 'var(--bg-subtle)' : 'transparent',
                                                    display: 'flex', alignItems: 'center', gap: 16,
                                                }}
                                            >
                                                <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid', borderColor: selectedClassId === c._id ? 'var(--accent)' : 'var(--border)', padding: 3, flexShrink: 0 }}>
                                                    {selectedClassId === c._id && <div style={{ width: '100%', height: '100%', background: 'var(--accent)', borderRadius: '50%' }} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600 }}>{templateLabel(c)}</div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Section: {c.section} · Installments: {c.installmentPlan.length}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: '1.125rem' }}>{formatCurrency(c.totalFee)}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 24 }}>
                                        <button type="button" className="btn-secondary" onClick={() => setWizardStep(1)}>← Back</button>
                                        <button type="button" className="btn-primary" onClick={handleWizardNext}>
                                            {selectedClassId ? 'Next: Concession & Summary →' : 'Next: Summary →'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Summary & Concession */}
                            {wizardStep === 3 && (
                                <div>
                                    <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 16 }}>Step 3: Admissions Summary</h4>

                                    <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, marginBottom: 20 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.875rem' }}>
                                            <div><span style={{ color: 'var(--text-muted)' }}>Student Name:</span> <strong style={{ marginLeft: 4 }}>{getValues('firstName')} {getValues('lastName')}</strong></div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <strong style={{ marginLeft: 4 }}>{getValues('phone')}</strong></div>

                                            {selectedClassId && (
                                                <div style={{ gridColumn: '1 / -1', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Enrolling in:</span>
                                                    <strong style={{ marginLeft: 4 }}>{templateLabel(classes.find(c => c._id === selectedClassId)!)} (Sec {classes.find(c => c._id === selectedClassId)?.section})</strong>
                                                    <span style={{ float: 'right', fontWeight: 700, color: '#10b981' }}>{formatCurrency(classes.find(c => c._id === selectedClassId)?.totalFee ?? 0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedClassId && canConcession && (
                                        <div style={{ marginBottom: 24 }}>
                                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                Apply Concession / Discount
                                                <select
                                                    value={concessionType}
                                                    onChange={e => { setConcessionType(e.target.value as any); setConcessionValue(0); }}
                                                    style={{ border: 'none', background: 'transparent', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--accent)', cursor: 'pointer', outline: 'none' }}
                                                >
                                                    <option value="NONE">No Concession</option>
                                                    <option value="PERCENTAGE">Percentage (%)</option>
                                                    <option value="FLAT">Flat Amount (₹)</option>
                                                </select>
                                            </label>

                                            {concessionType !== 'NONE' && (
                                                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                                    <div style={{ flex: 1 }}>
                                                        <input
                                                            type="number" className="form-input" min={0}
                                                            value={concessionValue} onChange={e => setConcessionValue(parseFloat(e.target.value))}
                                                            placeholder={concessionType === 'PERCENTAGE' ? "% Off" : "₹ Amount"}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 2 }}>
                                                        <input
                                                            type="text" className="form-input"
                                                            value={concessionReason} onChange={e => setConcessionReason(e.target.value)}
                                                            placeholder="Reason for concession"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 32 }}>
                                        <button type="button" className="btn-secondary" onClick={() => setWizardStep(2)}>← Back</button>
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            onClick={() => admissionMutation.mutate(getValues())}
                                            disabled={admissionMutation.isPending || (concessionType !== 'NONE' && (!concessionValue || !concessionReason))}
                                        >
                                            {admissionMutation.isPending ? 'Processing...' : 'Complete Admission'}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm Status Change */}
            <ConfirmModal
                open={!!confirmChange}
                onClose={() => setConfirmChange(null)}
                onConfirm={() => confirmChange && statusMutation.mutate(confirmChange)}
                title="Change Student Status"
                message={`Change ${confirmChange?.student.firstName} ${confirmChange?.student.lastName}'s status to "${confirmChange?.newStatus}"?`}
                variant={confirmChange?.newStatus === 'DROPPED' ? 'danger' : 'primary'}
                loading={statusMutation.isPending}
            />

            {/* Student Profile Detail Drawer */}
            <AnimatePresence>
                {viewProfileDrawer && selectedStudentForView && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="modal-overlay"
                            onClick={() => setViewProfileDrawer(false)}
                            style={{ zIndex: 1000 }}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed', right: 0, top: 0, bottom: 0, width: 480,
                                background: 'var(--bg-surface)', zIndex: 1001,
                                boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
                                padding: '32px 24px', overflowY: 'auto', borderLeft: '1px solid var(--border)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Student Profile</h3>
                                <button onClick={() => setViewProfileDrawer(false)} className="btn-secondary" style={{ padding: 8, borderRadius: '50%' }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, padding: 20, background: 'var(--bg-subtle)', borderRadius: 16 }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>
                                    {selectedStudentForView.firstName.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{selectedStudentForView.firstName} {selectedStudentForView.lastName}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: {selectedStudentForView.admissionNumber}</div>
                                </div>
                            </div>

                            <h4 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BookOpen size={18} color="var(--accent)" /> Enrollment History
                            </h4>

                            {profileEnrollments.length === 0 ? (
                                <div style={{ padding: 32, textAlign: 'center', background: 'var(--bg-muted)', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    No enrollment records found for this student.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {profileEnrollments.map(e => (
                                        <div key={e._id} style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-surface)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{e.academicYear} Enrollment</span>
                                                <span style={{
                                                    padding: '2px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700,
                                                    ...STATUS_STYLE[e.status]
                                                }}>{e.status}</span>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.8125rem', marginBottom: 16 }}>
                                                <div><span style={{ color: 'var(--text-muted)' }}>Net Payable:</span> <strong style={{ marginLeft: 4 }}>{formatCurrency(e.netFee)}</strong></div>
                                                <div><span style={{ color: 'var(--text-muted)' }}>Outstanding:</span> <strong style={{ marginLeft: 4, color: (e.outstandingBalance ?? 0) > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(e.outstandingBalance ?? 0)}</strong></div>
                                            </div>

                                            {/* Clarity about Concessions */}
                                            {e.concessionType !== 'NONE' && (
                                                <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                                    <Tag size={12} />
                                                    Applied {e.concessionValue}{e.concessionType === 'PERCENTAGE' ? '%' : '₹'} flat concession (Reduction from original fee)
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '6px 0' }} onClick={() => {
                                                    setViewProfileDrawer(false);
                                                    navigate(`/enrollments`); // Link to more detail if needed
                                                }}>View Ledger</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                                <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9375rem' }}>Contact Details</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Father's Phone:</span> <strong>{selectedStudentForView.phone}</strong></div>
                                    {selectedStudentForView.motherPhone && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Mother's Phone:</span> <strong>{selectedStudentForView.motherPhone}</strong></div>}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Father:</span> <strong>{selectedStudentForView.fatherName}</strong></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Mother:</span> <strong>{selectedStudentForView.motherName}</strong></div>
                                    {selectedStudentForView.email && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong>{selectedStudentForView.email}</strong></div>}
                                </div>
                                {selectedStudentForView.history?.previousSchool && (
                                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                                        <h5 style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: 8 }}>Previous Academic History</h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem' }}>
                                            <div><span style={{ color: 'var(--text-muted)' }}>School:</span> <strong>{selectedStudentForView.history.previousSchool}</strong></div>
                                            <div><span style={{ color: 'var(--text-muted)' }}>Last Score:</span> <strong>{selectedStudentForView.history.percentage}</strong> ({selectedStudentForView.history.yearPassout})</div>
                                            {selectedStudentForView.history.extraNote && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>"{selectedStudentForView.history.extraNote}"</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
