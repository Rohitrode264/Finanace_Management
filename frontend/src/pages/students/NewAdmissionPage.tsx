import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, GraduationCap,
    Info, User, Tag, CheckCircle, Printer
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import { studentsService } from '../../api/services/students.service';
import { categoryService } from '../../api/services/category.service';
import { enrollmentService } from '../../api/services/enrollment.service';
import { classesService } from '../../api/services/classes.service';
import type { AcademicClass, ClassTemplate } from '../../types';
import { formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

const CURRENT_YEAR = `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`;

const studentSchema = z.object({
    admissionNumber: z.string().optional().or(z.literal('')),
    firstName: z.string().min(1, 'First name required').max(100),
    lastName: z.string().min(1, 'Last name required').max(100),
    dob: z.string().optional(),
    phone: z.string().min(10, "Father's phone must be 10 digits"),
    motherPhone: z.string().min(10, "Mother's phone must be 10 digits").optional().or(z.literal('')),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    fatherName: z.string().min(1, "Father's name required").max(100),
    motherName: z.string().max(100).optional().or(z.literal('')),
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

const formatName = (name: string) => {
    if (!name) return '';
    return name
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export function NewAdmissionPage() {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [enrollYear] = useState(CURRENT_YEAR);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

    const { register, handleSubmit, formState: { errors }, getValues } = useForm<StudentForm>({
        resolver: zodResolver(studentSchema),
        defaultValues: { email: '', bloodGroup: '', phone: '', motherPhone: '', address: { street: '', city: '', state: '', zipCode: '' } }
    });

    const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);

    // Removed preemptive admission ID generation to prevent concurrent conflicting IDs, 
    // it will be generated safely by the backend during submission.

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [concessionType, setConcessionType] = useState<'NONE' | 'PERCENTAGE' | 'FLAT'>('NONE');
    const [concessionValue, setConcessionValue] = useState<number>(0);
    const [concessionReason, setConcessionReason] = useState<string>('');

    const canCreate = usePermission('CREATE_STUDENT');

    const { data: classesRes } = useQuery({
        queryKey: ['classes-for-admission', enrollYear],
        queryFn: () => classesService.listClasses(enrollYear),
    });
    const classes: AcademicClass[] = (classesRes?.data?.data as AcademicClass[] | undefined) ?? [];

    const { data: catRes } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.list(),
    });
    const categories = catRes?.data?.data || [];

    const { data: schoolsRes } = useQuery({
        queryKey: ['unique-schools'],
        queryFn: () => studentsService.getSchools(),
    });
    const uniqueSchools = schoolsRes?.data?.data || [];

    const { data: citiesRes } = useQuery({
        queryKey: ['unique-cities'],
        queryFn: () => studentsService.getCities(),
    });
    const uniqueCities = citiesRes?.data?.data || [];

    const { data: statesRes } = useQuery({
        queryKey: ['unique-states'],
        queryFn: () => studentsService.getStates(),
    });
    const uniqueStates = statesRes?.data?.data || [];

    const admissionMutation = useMutation({
        mutationFn: async (studentData: StudentForm) => {
            const formattedData = {
                ...studentData,
                admissionNumber: studentData.admissionNumber?.trim() || '',
                firstName: formatName(studentData.firstName),
                lastName: formatName(studentData.lastName),
                fatherName: formatName(studentData.fatherName),
                motherName: studentData.motherName ? formatName(studentData.motherName) : '',
                phone: studentData.phone.trim(),
                motherPhone: studentData.motherPhone ? studentData.motherPhone.trim() : '',
            };

            const studentRes = await studentsService.create(formattedData as any);
            const newStudentId = studentRes.data?.data?._id;
            if (!newStudentId) throw new Error('Failed to create student record');

            if (formattedData.schoolName) qc.invalidateQueries({ queryKey: ['unique-schools'] });
            if (formattedData.address?.city) qc.invalidateQueries({ queryKey: ['unique-cities'] });
            if (formattedData.address?.state) qc.invalidateQueries({ queryKey: ['unique-states'] });

            if (selectedClassId) {
                const enrollRes = await enrollmentService.enroll({
                    studentId: newStudentId,
                    academicClassId: selectedClassId,
                });
                const enrollmentId = enrollRes.data?.data?._id;

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
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['students'] });
            toast.success('Admissions process completed successfully');
            setCreatedStudentId(data);
            setWizardStep(4 as any);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Admissions process failed midway'),
    });

    const handleWizardNext = () => {
        if (wizardStep === 1) {
            handleSubmit(() => setWizardStep(2))();
        } else if (wizardStep === 2) {
            setWizardStep(3);
        }
    };

    const templateLabel = (cls: AcademicClass) => {
        const t = typeof cls.templateId === 'object' ? cls.templateId as ClassTemplate : null;
        if (t) return `Class ${t.grade}${t.stream ? ` – ${t.stream}` : ''} (${t.board})`;
        return `Class ID: ${cls._id}`;
    };

    if (!canCreate) {
        return (
            <div className="page-content">
                <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <h3 style={{ color: 'var(--danger)' }}>Access Denied</h3>
                    <p style={{ color: 'var(--text-muted)' }}>You don't have permission to perform new admissions.</p>
                    <button className="btn-secondary" onClick={() => navigate('/students')} style={{ marginTop: 24 }}>
                        Back to Students
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content" style={{ margin: '0 auto' }}>
            <PageHeader
                title="New Student Admission"
                subtitle="Complete the 3-step wizard to admit a new student into the system."
                backPath="/students"
            />

            <div className="admission-grid-layout" style={{ marginTop: 24 }}>
                {/* Left Column: Form Content */}
                <div className="card admission-form-card" style={{ position: 'relative' }}>
                    {/* Progress Header */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
                        {[1, 2, 3].map(step => (
                            <div key={step} style={{ flex: 1 }}>
                                <div style={{
                                    height: 4, borderRadius: 2,
                                    background: wizardStep >= step ? 'var(--accent)' : 'var(--bg-muted)',
                                    marginBottom: 12
                                }} />
                                <div className="step-label" style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    color: wizardStep === step ? 'var(--accent)' : 'var(--text-muted)'
                                }}>
                                    <span className="step-num">Step {step}:</span> {step === 1 ? 'Details' : step === 2 ? 'Course' : 'Concession'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <AnimatePresence mode="wait">
                        {wizardStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 24 }}>Personal Details</h3>
                                <form onSubmit={e => { e.preventDefault(); handleWizardNext(); }}>
                                    <div className="form-grid">
                                        <div style={{ gridColumn: 'span 1' }}>
                                            <label className="form-label">Admission Number</label>
                                            <input
                                                className="form-input"
                                                value="Generated upon Submission"
                                                readOnly
                                                style={{ background: 'var(--bg-subtle)', cursor: 'not-allowed', fontWeight: 800, color: 'var(--text-muted)' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Date of Birth</label>
                                            <input type="date" {...register('dob')} className="form-input" />
                                        </div>

                                        <div>
                                            <label className="form-label">First Name *</label>
                                            <input {...register('firstName')} className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="First name" />
                                        </div>
                                        <div>
                                            <label className="form-label">Last Name *</label>
                                            <input {...register('lastName')} className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Last name" />
                                        </div>

                                        <div>
                                            <label className="form-label">Father's Name *</label>
                                            <input {...register('fatherName')} className={`form-input ${errors.fatherName ? 'error' : ''}`} placeholder="Father's full name" />
                                        </div>
                                        <div>
                                            <label className="form-label">Contact Phone *</label>
                                            <input {...register('phone')} className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="Primary 10-digit number" />
                                        </div>

                                        <div>
                                            <label className="form-label">Mother's Name</label>
                                            <input {...register('motherName')} className="form-input" placeholder="Mother's full name" />
                                        </div>
                                        <div>
                                            <label className="form-label">Mother's Phone</label>
                                            <input {...register('motherPhone')} className="form-input" placeholder="Secondary 10-digit number" />
                                        </div>

                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Email</label>
                                            <input {...register('email')} className="form-input" placeholder="student@example.com" />
                                        </div>

                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Primary School History</label>
                                            <datalist id="schools-list">
                                                {uniqueSchools.map((s: string) => <option key={s} value={s} />)}
                                            </datalist>
                                            <input {...register('schoolName')} list="schools-list" className="form-input" placeholder="Previous or current school" />
                                        </div>

                                        <div>
                                            <label className="form-label">City</label>
                                            <datalist id="cities-list">
                                                {uniqueCities.map((c: string) => <option key={c} value={c} />)}
                                            </datalist>
                                            <input {...register('address.city')} list="cities-list" className="form-input" placeholder="e.g. Nagpur" />
                                        </div>
                                        <div>
                                            <label className="form-label">State</label>
                                            <datalist id="states-list">
                                                {uniqueStates.map((s: string) => <option key={s} value={s} />)}
                                            </datalist>
                                            <input {...register('address.state')} list="states-list" className="form-input" placeholder="e.g. Maharashtra" />
                                        </div>

                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Program Category *</label>
                                            <select {...register('program')} className={`form-select ${errors.program ? 'error' : ''}`}>
                                                <option value="">Select a program...</option>
                                                {categories.map((c: any) => <option key={c._id} value={c.name}>{c.name}</option>)}
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                                        <button type="button" className="btn-secondary" onClick={() => navigate('/students')} style={{ flex: '1 1 auto', justifyContent: 'center' }}>Cancel</button>
                                        <button type="submit" className="btn-primary" style={{ flex: '1 1 auto', justifyContent: 'center' }}>Next: Course Selection <ChevronRight size={16} /></button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {wizardStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Assign Course</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.875rem' }}>Select the class student is enrolling into for the session {enrollYear}.</p>

                                <div style={{ display: 'grid', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 8 }} className="custom-scrollbar">
                                    {classes.map(cls => (
                                        <div
                                            key={cls._id}
                                            onClick={() => setSelectedClassId(cls._id)}
                                            style={{
                                                padding: '16px 20px',
                                                borderRadius: 16,
                                                border: '1.5px solid',
                                                borderColor: selectedClassId === cls._id ? 'var(--accent)' : 'var(--border)',
                                                background: selectedClassId === cls._id ? 'var(--accent-light)' : 'var(--bg-surface)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: selectedClassId === cls._id ? 'var(--accent)' : 'var(--text-primary)' }}>{templateLabel(cls)}</div>
                                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                    Section: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{cls.section}</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(cls.totalFee)}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Total Fee</div>
                                            </div>
                                        </div>
                                    ))}
                                    {classes.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-subtle)', borderRadius: 16, color: 'var(--text-muted)' }}>
                                            No classes found for {enrollYear}.
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setWizardStep(1)} style={{ flex: '1 1 auto', justifyContent: 'center' }}><ChevronLeft size={16} /> Back</button>
                                    <div style={{ display: 'flex', gap: 12, flex: '1 1 auto', flexWrap: 'wrap' }}>
                                        <button type="button" className="btn-ghost" onClick={() => { setSelectedClassId(''); setWizardStep(3); }} style={{ flex: '1 1 auto', justifyContent: 'center' }}>Skip Course</button>
                                        <button type="button" className="btn-primary" onClick={() => setWizardStep(3)} style={{ flex: '1 1 auto', justifyContent: 'center' }}>Next: Concession <ChevronRight size={16} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {wizardStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Financial Concession</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.875rem' }}>Apply any discount or scholarship to the selected course fees.</p>

                                <div className="card" style={{ padding: 24, background: 'var(--bg-subtle)', border: 'none', marginBottom: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Student Name:</span>
                                        <span style={{ fontWeight: 700 }}>{getValues('firstName')} {getValues('lastName')}</span>
                                    </div>
                                    {selectedClassId && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enrollment Fee:</span>
                                            <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(classes.find(c => c._id === selectedClassId)?.totalFee ?? 0)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Concession Type</label>
                                    <select
                                        value={concessionType}
                                        onChange={e => { setConcessionType(e.target.value as any); setConcessionValue(0); }}
                                        className="form-select"
                                    >
                                        <option value="NONE">No Concession</option>
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FLAT">Flat Amount (₹)</option>
                                    </select>
                                </div>

                                {concessionType !== 'NONE' && (
                                    <div className="form-grid" style={{ marginTop: 20 }}>
                                        <div>
                                            <label className="form-label">{concessionType === 'PERCENTAGE' ? 'Discount Percentage' : 'Discount Amount'}</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={concessionValue}
                                                onChange={e => setConcessionValue(parseFloat(e.target.value))}
                                                placeholder={concessionType === 'PERCENTAGE' ? "%" : "₹"}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Reason (Optional)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={concessionReason}
                                                onChange={e => setConcessionReason(e.target.value)}
                                                placeholder="e.g. Scholarship"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setWizardStep(2)} style={{ flex: '1 1 auto', justifyContent: 'center' }}><ChevronLeft size={16} /> Back</button>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        style={{ paddingRight: 32, paddingLeft: 32, flex: '1 1 auto', justifyContent: 'center' }}
                                        onClick={() => admissionMutation.mutate(getValues())}
                                        disabled={admissionMutation.isPending || (concessionType !== 'NONE' && !concessionValue)}
                                    >
                                        {admissionMutation.isPending ? 'Finalizing...' : 'Complete Admission'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {wizardStep === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', padding: '40px 0' }}
                            >
                                <div style={{ width: 80, height: 80, background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--success)' }}>
                                    <CheckCircle size={40} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Admission Successful</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9375rem' }}>
                                    {getValues('firstName')} {getValues('lastName')} has been successfully enrolled.
                                </p>

                                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button 
                                        type="button" 
                                        className="btn-primary"
                                        onClick={() => window.open(`/students/${createdStudentId}/print`, '_blank')}
                                    >
                                        <Printer size={16} /> Print Admission Form
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => navigate('/students')}>
                                        Go to Students List
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: Summary/Help */}
                <div>
                    <div className="card" style={{ padding: 24 }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 20 }}>Admission Summary</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={18} color="var(--accent)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>STUDENT</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{getValues('firstName') || '—'} {getValues('lastName') || ''}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <GraduationCap size={18} color="var(--success)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>COURSE</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedClassId ? templateLabel(classes.find(c => c._id === selectedClassId)!) : 'Not Selected'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Tag size={18} color="var(--warning)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>CONCESSION</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{concessionType === 'NONE' ? 'None' : concessionType === 'PERCENTAGE' ? `${concessionValue}% Off` : `₹${concessionValue} Flat`}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, borderLeft: '3px solid var(--info)' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--info)', marginBottom: 4 }}>
                                <Info size={14} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Note</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                Admission record will be created immediately. Ledger entries and concession will be applied as credit entries.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
