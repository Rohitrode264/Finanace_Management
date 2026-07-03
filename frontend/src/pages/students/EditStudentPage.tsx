import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Save, BookOpen } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { studentsService } from '../../api/services/students.service';
import toast from 'react-hot-toast';


const studentSchema = z.object({
    firstName: z.string().min(1, 'First name required').max(100),
    lastName: z.string().min(1, 'Last name required').max(100),
    dob: z.string().optional(),
    phone: z.string().min(10, "Father's phone must be 10 digits"),
    alternatePhone: z.string().optional(),
    motherPhone: z.string().min(10, "Mother's phone must be 10 digits").optional().or(z.literal('')),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    fatherName: z.string().min(1, "Father's name required").max(100),
    motherName: z.string().max(100).optional().or(z.literal('')),
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
    whatsappNumber: z.string().optional().or(z.literal('')),
    cetBucket: z.enum(['PCM', 'PCB']).optional().or(z.literal('')),
});

type StudentForm = z.infer<typeof studentSchema>;

export function EditStudentPage() {
    const { id } = useParams<{ id: string }>();
    const qc = useQueryClient();
    const navigate = useNavigate();

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

    const { data: studentRes, isLoading } = useQuery({
        queryKey: ['student', id],
        queryFn: () => studentsService.getById(id!),
        enabled: !!id
    });
    
    const student = studentRes?.data?.data;

    const { register, handleSubmit, formState: { errors }, reset, trigger, getValues } = useForm<StudentForm>({
        resolver: zodResolver(studentSchema),
    });

    // CET is detected if:
    // 1. The student's current class name contains 'CET' (e.g. "Class 11 & 12 CET"), OR
    // 2. The student already has a cetBucket saved (existing CET registration)
    const isCET = !!(
        student?.currentEnrollment?.className?.toUpperCase().includes('CET') ||
        student?.cetBucket
    );

    useEffect(() => {
        if (student) {
            reset({
                firstName: student.firstName,
                lastName: student.lastName,
                dob: student.dob || '',
                phone: student.phone,
                alternatePhone: student.alternatePhone || '',
                motherPhone: student.motherPhone || '',
                email: student.email || '',
                fatherName: student.fatherName,
                motherName: student.motherName || '',
                whatsappNumber: student.whatsappNumber || '',
                cetBucket: student.cetBucket,
                schoolName: student.schoolName || '',
                bloodGroup: student.bloodGroup || '',
                address: {
                    street: student.address?.street || '',
                    city: student.address?.city || '',
                    state: student.address?.state || '',
                    zipCode: student.address?.zipCode || ''
                },
                history: {
                    previousSchool: student.history?.previousSchool || '',
                    percentage: student.history?.percentage || '',
                    yearPassout: student.history?.yearPassout || '',
                    extraNote: student.history?.extraNote || ''
                }
            });
        }
    }, [student, reset]);

    const updateMutation = useMutation({
        mutationFn: async (studentData: StudentForm) => {
            const formattedData = {
                ...studentData,
                phone: studentData.phone.trim(),
                motherPhone: studentData.motherPhone ? studentData.motherPhone.trim() : '',
                whatsappNumber: studentData.whatsappNumber ? studentData.whatsappNumber.trim() : '',
            };

            await studentsService.update(id!, formattedData as any);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['students'] });
            qc.invalidateQueries({ queryKey: ['student', id] });
            toast.success('Student details updated successfully');
            navigate('/students');
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to update student details'),
    });

    if (isLoading || !student) {
        return (
            <div className="" style={{ display: 'flex', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                Loading student details...
            </div>
        );
    }

    return (
        <div className="" style={{ margin: '0 auto', maxWidth: 800 }}>
            <PageHeader
                title="Edit Student Details"
                subtitle={`Editing record for ${student.firstName} ${student.lastName} (${student.admissionNumber})`}
                backPath="/students"
            />

            <div className="card admission-form-card" style={{ marginTop: 24 }}>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (isCET) {
                        await trigger(['whatsappNumber', 'cetBucket']);
                        const whatsapp = getValues('whatsappNumber');
                        const bucket = getValues('cetBucket');
                        if (!whatsapp || !bucket) {
                            toast.error('WhatsApp Number and CET Bucket are required for CET students.');
                            return;
                        }
                    }
                    handleSubmit((data) => updateMutation.mutate(data))(e);
                }}>
                    <div className="form-grid">
                        <div>
                            <label className="form-label">Admission Number</label>
                            <input
                                className="form-input"
                                value={student.admissionNumber}
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
                        
                        <div>
                            <label className="form-label">Alternate Phone</label>
                            <input {...register('alternatePhone')} className="form-input" placeholder="Auxiliary contact" />
                        </div>
                        <div>
                            <label className="form-label">Blood Group</label>
                            <input {...register('bloodGroup')} className="form-input" placeholder="e.g. O+" />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Email</label>
                            <input {...register('email')} className="form-input" placeholder="student@example.com" />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Current School</label>
                            <datalist id="schools-list">
                                {uniqueSchools.map((s: string) => <option key={s} value={s} />)}
                            </datalist>
                            <input {...register('schoolName')} list="schools-list" className="form-input" placeholder="Name of the current school" />
                        </div>
                        
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Notes</label>
                            <input {...register('history.extraNote')} className="form-input" placeholder="Any additional notes" />
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

                        {isCET && (
                            <div style={{
                                gridColumn: '1 / -1',
                                borderRadius: 16,
                                border: '1.5px solid var(--accent)',
                                overflow: 'hidden',
                                marginTop: 8,
                            }}>
                                {/* Header */}
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 14,
                                    padding: '16px 20px',
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                                    borderBottom: '1px solid rgba(99,102,241,0.2)',
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                        background: 'var(--accent)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <BookOpen size={18} color="#fff" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                                            Learning Portal Access
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                            These details are required to activate this student's account on the <strong>NCP Learning Portal</strong>. The WhatsApp number is used for OTP-based login, and the subject bucket determines their course access.
                                        </div>
                                    </div>
                                </div>
                                {/* Fields */}
                                <div className="form-grid" style={{ padding: '20px' }}>
                                    <div>
                                        <label className="form-label">WhatsApp Number *</label>
                                        <input
                                            {...register('whatsappNumber')}
                                            className={`form-input ${errors.whatsappNumber ? 'error' : ''}`}
                                            placeholder="10-digit number (used for OTP login)"
                                        />
                                        {errors.whatsappNumber && (
                                            <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                                                {errors.whatsappNumber.message}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="form-label">Subject Bucket *</label>
                                        <select
                                            {...register('cetBucket')}
                                            className={`form-select ${errors.cetBucket ? 'error' : ''}`}
                                        >
                                            <option value="">Select subject group</option>
                                            <option value="PCM">PCM — Physics, Chemistry & Maths</option>
                                            <option value="PCB">PCB — Physics, Chemistry & Biology</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                        <button type="button" className="btn-secondary" onClick={() => navigate('/students')} style={{ flex: '1 1 auto', justifyContent: 'center' }}><ChevronLeft size={16} /> Cancel</button>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ flex: '1 1 auto', justifyContent: 'center' }}
                            disabled={updateMutation.isPending}
                        >
                            <Save size={16} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
