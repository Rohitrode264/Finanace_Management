import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, ChevronLeft, ChevronRight, User, Tag,
    Phone, MapPin, GraduationCap,
    Calendar, Info, Printer, Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { usePermission } from '../../hooks/usePermission';
import { useDebounce } from '../../hooks/useDebounce';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { studentsService } from '../../api/services/students.service';
import apiClient from '../../api/client';
import type { Student, StudentStatus, Enrollment } from '../../types';
import { formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

const DetailField = ({ label, value, icon: Icon }: { label: string; value: string | number | undefined; icon?: any }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        {Icon && <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--bg-surface)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', flexShrink: 0
        }}><Icon size={14} /></div>}
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em', marginBottom: 1 }}>{label}</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || '—'}</div>
        </div>
    </div>
);

const STATUS_COLORS: Record<StudentStatus, { bg: string; color: string }> = {
    ACTIVE: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    DROPPED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    PASSED_OUT: { bg: 'var(--bg-muted)', color: 'var(--text-secondary)' },
};

export function StudentsPage() {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [viewProfileDrawer, setViewProfileDrawer] = useState<boolean>(false);
    const [selectedStudentForView, setSelectedStudentForView] = useState<Student | null>(null);
    const [profileTab, setProfileTab] = useState<'overview' | 'academic' | 'personal'>('overview');

    // Filter state
    const [search, setSearch] = useState('');
    const [program] = useState('');
    const [skip, setSkip] = useState(0);
    const LIMIT = 12;
    const [confirmChange, setConfirmChange] = useState<{ student: Student; newStatus: StudentStatus } | null>(null);
    const dSearch = useDebounce(search);

    const canCreate = usePermission('CREATE_STUDENT');
    const canUpdate = usePermission('UPDATE_STUDENT');

    const { data: studentsRes, isLoading } = useQuery({
        queryKey: ['students', skip, dSearch, program],
        queryFn: () => studentsService.list({ limit: LIMIT, skip, search: dSearch || undefined, program: program || undefined }),
    });

    const students: Student[] = studentsRes?.data?.data?.students ?? [];
    const total: number = studentsRes?.data?.data?.total ?? 0;
    const totalPages = Math.ceil(total / LIMIT);
    const page = Math.floor(skip / LIMIT) + 1;

    // Fetch enrollments for the currently viewed student profile
    const { data: profileEnrollmentsRes } = useQuery({
        queryKey: ['student-enrollments', selectedStudentForView?._id],
        queryFn: () => apiClient.get(`/enrollments/student/${selectedStudentForView?._id}`),
        enabled: viewProfileDrawer && !!selectedStudentForView,
    });
    const profileEnrollments: (Enrollment & { outstandingBalance?: number })[] = profileEnrollmentsRes?.data?.data || [];

    const statusMutation = useMutation({
        mutationFn: ({ student, newStatus }: { student: Student; newStatus: StudentStatus }) =>
            studentsService.updateStatus(student._id, newStatus),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['students'] });
            toast.success(`Student status changed to ${vars.newStatus}`);
            setConfirmChange(null);
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Status update failed'),
    });

    return (
        <div className="page-content">
            <PageHeader
                title="Student Directory"
                subtitle="Manage student admissions, track enrollments, and view academic history."
                actions={
                    <div style={{ display: 'flex', gap: 12 }}>
                        <SearchInput
                            value={search}
                            onChange={(val) => { setSearch(val); setSkip(0); }}
                            placeholder="Search name, phone, or ID..."
                        />
                        {canCreate && (
                            <button className="btn-primary" onClick={() => navigate('/students/new')} style={{ height: 42 }}>
                                <Plus size={18} /> New Admission
                            </button>
                        )}
                    </div>
                }
            />

            {/* Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student Details</th>
                            <th>Father Details</th>
                            <th>Mother Details</th>
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
                                    {Array.from({ length: canUpdate ? 8 : 7 }).map((_, j) => (
                                        <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                                    ))}
                                </tr>
                            ))
                        ) : students.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No students found matching criteria.</td></tr>
                        ) : (
                            students.map((s) => {
                                const sc = STATUS_COLORS[s.status] || { bg: 'var(--bg-muted)', color: 'var(--text-secondary)' };
                                return (
                                    <tr key={s._id} onClick={() => { setSelectedStudentForView(s); setViewProfileDrawer(true); }} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 10, background: 'var(--bg-subtle)',
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
                                        <td>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{s.phone}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                <TruncatedText text={s.fatherName} maxWidth="120px" modalTitle="Father's Name" />
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{s.motherPhone || '-'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                <TruncatedText text={s.motherName || '-'} maxWidth="120px" modalTitle="Mother's Name" />
                                            </div>
                                        </td>
                                        <td>
                                            <TruncatedText text={s.schoolName || '-'} maxWidth="140px" modalTitle="School Name" />
                                        </td>
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
                                                            newStatus: e.target.value as StudentStatus
                                                        })}
                                                        className="form-select"
                                                        style={{ height: 32, fontSize: '0.75rem', width: 110 }}
                                                    >
                                                        <option value="ACTIVE">Mark Active</option>
                                                        <option value="DROPPED">Mark Dropped</option>
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
            <div className="pagination-container" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Showing <strong>{students.length}</strong> of <strong>{total}</strong> students
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className="btn-secondary"
                        disabled={skip === 0}
                        onClick={() => setSkip(Math.max(0, skip - LIMIT))}
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <button
                        className="btn-secondary"
                        disabled={page >= totalPages}
                        onClick={() => setSkip(skip + LIMIT)}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </div>

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
            {createPortal(
                <AnimatePresence>
                    {viewProfileDrawer && selectedStudentForView && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="modal-overlay"
                                onClick={() => setViewProfileDrawer(false)}
                                style={{ position: 'absolute', inset: 0, zIndex: 1000, backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.4)' }}
                            />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            style={{
                                position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(600px, 100vw)',
                                background: 'var(--bg-surface)', zIndex: 1001,
                                boxShadow: 'var(--shadow-xl)',
                                overflowY: 'hidden', borderLeft: '1px solid var(--border)',
                                display: 'flex', flexDirection: 'column'
                            }}
                        >
                            {/* Industrial Header */}
                            <div style={{
                                padding: '24px 32px',
                                background: 'var(--bg-surface)',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 14,
                                        background: 'var(--accent-light)', color: 'var(--accent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.25rem', fontWeight: 800
                                    }}>
                                        {selectedStudentForView.firstName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                                            {selectedStudentForView.firstName} {selectedStudentForView.lastName}
                                        </h3>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                                                ID: {selectedStudentForView.admissionNumber}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                                background: STATUS_COLORS[selectedStudentForView.status]?.bg,
                                                color: STATUS_COLORS[selectedStudentForView.status]?.color
                                            }}>
                                                {selectedStudentForView.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <button className="btn-secondary btn-sm" onClick={() => window.open(`/students/${selectedStudentForView._id}/print`, '_blank')} title="Print Form">
                                        <Printer size={16} />
                                    </button>
                                    <button className="btn-secondary btn-sm" onClick={() => navigate(`/students/${selectedStudentForView._id}/edit`)} title="Edit Student">
                                        <Edit size={16} />
                                    </button>
                                    <button className="btn-icon" onClick={() => setViewProfileDrawer(false)} style={{ background: 'transparent', border: 'none' }}>
                                        <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs Navigation */}
                            <div style={{ display: 'flex', gap: 24, padding: '0 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                                {(['overview', 'academic', 'personal'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setProfileTab(tab)}
                                        style={{
                                            padding: '16px 0', fontSize: '0.8125rem', fontWeight: 700, color: profileTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                                            borderBottom: `2px solid ${profileTab === tab ? 'var(--accent)' : 'transparent'}`,
                                            background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.04em'
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Active Tab Content */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {profileTab === 'overview' && (
                                        <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                                                <DetailField label="Contact Number" value={selectedStudentForView.phone} icon={Phone} />
                                                <DetailField label="Mother's Phone" value={selectedStudentForView.motherPhone} icon={Phone} />
                                                <DetailField label="Email Address" value={selectedStudentForView.email} icon={Calendar} />
                                                <DetailField label="Admitted On" value={format(new Date(selectedStudentForView.createdAt), 'dd MMM yyyy')} icon={Calendar} />
                                            </div>

                                            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 16 }}>Current Enrollments</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {profileEnrollments.map(en => (
                                                    <div key={en._id} className="card" style={{ padding: 16, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Session {en.academicYear}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class ID: {typeof en.academicClassId === 'string' ? en.academicClassId : en.academicClassId._id}</div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ color: 'var(--success)', fontWeight: 800 }}>{formatCurrency(en.netFee)}</div>
                                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Fee</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Outstanding Balance:</span>
                                                            <span style={{ fontWeight: 800, color: (en.outstandingBalance ?? 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                                                {formatCurrency(en.outstandingBalance ?? 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {profileEnrollments.length === 0 && (
                                                    <div style={{ padding: 24, textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                        No enrollment history found.
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {profileTab === 'academic' && (
                                        <motion.div key="academic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0 }}>Education Background</h4>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                                    <DetailField label="Last Attended School" value={selectedStudentForView.history?.previousSchool} icon={GraduationCap} />
                                                    <DetailField label="Passout Year" value={selectedStudentForView.history?.yearPassout} icon={Calendar} />
                                                    <DetailField label="Percentage / Grade" value={selectedStudentForView.history?.percentage} icon={Info} />
                                                </div>
                                                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Counseling Notes</div>
                                                    <p style={{ fontSize: '0.875rem', lineHeight: 1.5, margin: 0, color: 'var(--text-secondary)' }}>{selectedStudentForView.history?.extraNote || 'No additional notes provided.'}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {profileTab === 'personal' && (
                                        <motion.div key="personal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} />
                                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0 }}>Identity & Address</h4>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                                                    <DetailField label="Blood Group" value={selectedStudentForView.bloodGroup} icon={Tag} />
                                                    <DetailField label="Category" value={selectedStudentForView.program} icon={User} />
                                                </div>
                                                <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                                    <DetailField label="Residential Address" value={`${selectedStudentForView.address?.street || ''}, ${selectedStudentForView.address?.city || ''}, ${selectedStudentForView.address?.state || ''} - ${selectedStudentForView.address?.zipCode || ''}`} icon={MapPin} />
                                                </div>
                                            </div>

                                            <div className="card" style={{ padding: 24 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--info)' }} />
                                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0 }}>Parental Information</h4>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                                    <DetailField label="Father's Full Name" value={selectedStudentForView.fatherName} icon={User} />
                                                    <DetailField label="Mother's Full Name" value={selectedStudentForView.motherName} icon={User} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
                </AnimatePresence>,
                document.body
            )}
        </div >
    );
}

