import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, School, Calendar, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import { useThemeStore } from '../../store/themeStore';
import { classesService } from '../../api/services/classes.service';
import { formatCurrency } from '../../utils/currency';
import { TruncatedText } from '../../components/ui/TruncatedText';
import { EmptyState } from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import type { AcademicClass, ClassTemplate, Board } from '../../types';

type Tab = 'classes' | 'create-template' | 'create-class';

const CURRENT_YEAR = `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`;

const templateSchema = z.object({
    grade: z.string().min(1, 'Grade required').max(10),
    stream: z.string().max(20).optional(),
    board: z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'OTHER', ''] as const).optional().or(z.literal('')),
});
type TemplateForm = z.infer<typeof templateSchema>;

const installmentItemSchema = z.object({
    installmentNo: z.number().int().positive(),
    dueDate: z.string().min(1, 'Due date required'),
    amount: z.number().positive('Amount must be positive'),
});
const classSchema = z.object({
    templateId: z.string().min(24, 'Select a class template'),
    academicYear: z.string().regex(/^\d{4}-\d{2,4}$/, 'Format: YYYY-YY or YYYY-YYYY'),
    section: z.string().min(1).max(5),
    totalFee: z.number().positive('Fee must be positive'),
    installmentPlan: z.array(installmentItemSchema).min(1, 'At least one installment required'),
});
type ClassForm = z.infer<typeof classSchema>;

export function ClassesPage() {
    const qc = useQueryClient();
    const [tab, setTab] = useState<Tab>('classes');
    const [academicYear, setAcademicYear] = useState(CURRENT_YEAR);
    const navigate = useNavigate();
    const canCreate = usePermission('CREATE_CLASS');
    const theme = useThemeStore((s) => s.theme);

    const { data: classesRes, isLoading: cLoading } = useQuery({
        queryKey: ['academic-classes', academicYear],
        queryFn: () => classesService.listClasses(academicYear),
        enabled: tab === 'classes',
    });

    const { data: templatesRes } = useQuery({
        queryKey: ['class-templates'],
        queryFn: () => classesService.listTemplates(),
        enabled: tab === 'create-class',
    });

    const { data: sessionsRes } = useQuery({
        queryKey: ['class-sessions'],
        queryFn: () => classesService.listSessions(),
    });

    const classes: AcademicClass[] = (classesRes?.data?.data as AcademicClass[] | undefined) ?? [];
    const templates: ClassTemplate[] = (templatesRes?.data?.data as ClassTemplate[] | undefined) ?? [];
    const sessions: string[] = (sessionsRes?.data?.data as string[] | undefined) ?? [];

    const sessionOptions = Array.from(new Set([CURRENT_YEAR, ...sessions])).sort((a, b) => b.localeCompare(a));

    const templateMutation = useMutation({
        mutationFn: (d: TemplateForm) => classesService.createTemplate({
            grade: d.grade,
            stream: d.stream || null,
            board: (d.board || '') as Board,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['class-templates'] });
            toast.success('Class template created');
            resetTemplate();
            setTab('classes');
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to create template'),
    });

    const classMutation = useMutation({
        mutationFn: (d: ClassForm) => {
            const sum = d.installmentPlan.reduce((a, b) => a + b.amount, 0);
            if (Math.abs(sum - d.totalFee) > 0.01) {
                throw new Error(`Installment amounts (${formatCurrency(sum)}) must sum to total fee (${formatCurrency(d.totalFee)})`);
            }
            return classesService.createClass({
                templateId: d.templateId,
                academicYear: d.academicYear,
                section: d.section,
                totalFee: d.totalFee,
                installmentPlan: d.installmentPlan.map((ip, idx) => ({
                    installmentNo: idx + 1,
                    dueDate: ip.dueDate,
                    amount: ip.amount,
                })),
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['academic-classes'] });
            qc.invalidateQueries({ queryKey: ['class-sessions'] });
            toast.success('Academic class created');
            resetClass();
            setTab('classes');
        },
        onError: (e: any) => toast.error(e?.response?.data?.error ?? e?.message ?? 'Failed to create class'),
    });

    const { register: regTemplate, handleSubmit: hsTemplate, formState: { errors: tErrors }, reset: resetTemplate } = useForm<TemplateForm>({
        resolver: zodResolver(templateSchema),
        defaultValues: { board: 'CBSE' },
    });

    const { register: regClass, handleSubmit: hsClass, formState: { errors: cErrors }, reset: resetClass, watch: watchClass, control } = useForm<ClassForm>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(classSchema) as any,
        defaultValues: { academicYear: CURRENT_YEAR, installmentPlan: [{ installmentNo: 1, dueDate: '', amount: 0 }] },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'installmentPlan' });

    const watchedTotalFee = watchClass('totalFee') || 0;
    const watchedInstallments = watchClass('installmentPlan') || [];
    const installmentSum = watchedInstallments.reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0);

    const tabStyle = (active: boolean) => ({
        padding: '8px 20px',
        background: active ? '#6366f1' : 'var(--bg-subtle)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        fontSize: '0.875rem', fontWeight: 600 as const,
        transition: 'all 0.2s',
        flexShrink: 0,
    });

    return (
        <div className="classes-page-container">
            <PageHeader
                title=""
                subtitle=""
                actions={
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button style={tabStyle(tab === 'classes')} onClick={() => setTab('classes')} className="flex items-center">
                                <Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Academic Classes
                            </button>
                            {canCreate && (
                                <>
                                    <button style={tabStyle(tab === 'create-template')} onClick={() => setTab('create-template')} className="flex items-center">
                                        <School size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                        Create Template
                                    </button>
                                    <button style={tabStyle(tab === 'create-class')} onClick={() => setTab('create-class')} className="flex items-center">
                                        <Plus size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                        Create Class
                                    </button>
                                </>
                            )}
                        </div>

                        {tab === 'classes' && (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 10, 
                                marginLeft: 'auto',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                padding: '6px 14px',
                                borderRadius: 10,
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'all 0.2s',
                            }}>
                                <span style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 6,
                                    fontSize: '0.8125rem', 
                                    fontWeight: 600, 
                                    color: 'var(--text-secondary)' 
                                }}>
                                    <Calendar size={14} style={{ color: 'var(--accent)', marginRight: 2 }} />
                                    Academic Year
                                </span>
                                <div style={{ 
                                    width: 1, 
                                    height: 18, 
                                    background: 'var(--border)' 
                                }} />
                                <select
                                    value={academicYear}
                                    onChange={e => setAcademicYear(e.target.value)}
                                    style={{ 
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.8125rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        outline: 'none',
                                        padding: '2px 8px',
                                        marginRight: -4,
                                        colorScheme: theme,
                                    }}
                                >
                                    {sessionOptions.map(yr => (
                                        <option 
                                            key={yr} 
                                            value={yr} 
                                            style={{ 
                                                background: theme === 'dark' ? '#2c2c2e' : '#ffffff', 
                                                color: theme === 'dark' ? '#f5f5f7' : '#1d1d1f' 
                                            }}
                                        >
                                            {yr}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                }
            />

            {/* Academic Classes tab */}
            {tab === 'classes' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="table-container">
                        <table className="data-table compact-table">
                            <thead>
                                <tr>
                                    <th>Template</th>
                                    <th>Year</th>
                                    <th>Section</th>
                                    <th style={{ textAlign: 'right' }}>Total Fee</th>
                                    <th>Installments</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cLoading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                                        ))}</tr>
                                    ))
                                ) : classes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState
                                                type="classes"
                                                title={`No Classes for ${academicYear}`}
                                                description="No academic classes found for this year. Try a different year or create one."
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    classes.map((c) => {
                                        const tmpl = typeof c.templateId === 'object' ? c.templateId as ClassTemplate : null;
                                        return (
                                            <tr key={c._id} onClick={() => navigate(`/classes/${c._id}/students`)} style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={{ fontWeight: 600 }}>
                                                                                    <TruncatedText
                                                        text={tmpl ? `Class ${tmpl.grade}${tmpl.stream ? ` – ${tmpl.stream}` : ''}${tmpl.board ? ` (${tmpl.board})` : ''}` : c._id}
                                                        maxWidth="200px"
                                                        modalTitle="Class Template Details"
                                                    />
                                                </td>
                                                <td>{c.academicYear}</td>
                                                <td>{c.section}</td>
                                                <td className="financial-value">{formatCurrency(c.totalFee)}</td>
                                                <td>
                                                    <span className="badge badge-indigo">
                                                        {c.installmentPlan?.length ?? 0} installment{c.installmentPlan?.length !== 1 ? 's' : ''}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                                                        background: c.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                        color: c.isActive ? '#10b981' : '#ef4444',
                                                    }}>
                                                        {c.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                 )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile card view */}
                    {!cLoading && classes.length > 0 && (
                        <div className="mobile-card">
                            {classes.map((c) => {
                                const tmpl = typeof c.templateId === 'object' ? c.templateId as ClassTemplate : null;
                                const label = tmpl ? `Class ${tmpl.grade}${tmpl.stream ? ` – ${tmpl.stream}` : ''}${tmpl.board ? ` (${tmpl.board})` : ''}` : c._id;
                                return (
                                    <div key={c._id} className="mobile-card-item" onClick={() => navigate(`/classes/${c._id}/students`)} style={{ cursor: 'pointer' }}>
                                        <div className="mobile-card-header">
                                            <div>
                                                <div className="mobile-card-title">{label}</div>
                                                <div className="mobile-card-subtitle">Section {c.section} · {c.academicYear}</div>
                                            </div>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600,
                                                background: c.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: c.isActive ? '#10b981' : '#ef4444',
                                            }}>
                                                {c.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="mobile-card-row">
                                            <span className="mobile-card-row-label">Total Fee</span>
                                            <span className="mobile-card-row-value">{formatCurrency(c.totalFee)}</span>
                                        </div>
                                        <div className="mobile-card-row">
                                            <span className="mobile-card-row-label">Installments</span>
                                            <span className="mobile-card-row-value">{c.installmentPlan?.length ?? 0}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Create Template form */}
            {tab === 'create-template' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="card" style={{ padding: 28, maxWidth: 520 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Create Class Template</h3>
                        <form onSubmit={hsTemplate(d => templateMutation.mutate(d))}>
                            <div style={{ marginBottom: 16 }}>
                                <label className="form-label">Class *</label>
                                <input {...regTemplate('grade')} className={`form-input ${tErrors.grade ? 'error' : ''}`} placeholder="e.g. 11, 12, 10" />
                                {tErrors.grade && <p className="form-error">{tErrors.grade.message}</p>}
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label className="form-label">Stream (optional)</label>
                                <input {...regTemplate('stream')} className="form-input" placeholder="e.g. SCIENCE, COMMERCE, ARTS" />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label className="form-label">Board (optional)</label>
                                <select {...regTemplate('board')} className="form-select">
                                    <option value="">— None (e.g. JEE, NEET) —</option>
                                    {(['CBSE', 'ICSE', 'STATE', 'IB', 'OTHER'] as Board[]).map(b => (
                                        b ? <option key={b} value={b}>{b}</option> : null
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => { setTab('classes'); resetTemplate(); }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={templateMutation.isPending}>
                                    {templateMutation.isPending ? 'Creating...' : 'Create Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* Create Class form */}
            {tab === 'create-class' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="card" style={{ padding: 28, maxWidth: 700 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Create Academic Class</h3>
                        <form onSubmit={hsClass(d => classMutation.mutate(d))}>
                            <div className="form-grid" style={{ marginBottom: 16 }}>
                                <div>
                                    <label className="form-label">Class Template *</label>
                                    <select {...regClass('templateId')} className={`form-select ${cErrors.templateId ? 'error' : ''}`}>
                                        <option value="">— Select a template —</option>
                                        {templates.map(t => (
                                            <option key={t._id} value={t._id}>
                                                Class {t.grade}{t.stream ? ` – ${t.stream}` : ''}{t.board ? ` (${t.board})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {templates.length === 0 && (
                                        <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>
                                            No templates yet — create a template first.
                                        </p>
                                    )}
                                    {cErrors.templateId && <p className="form-error">{cErrors.templateId.message}</p>}
                                </div>
                                <div>
                                    <label className="form-label">Academic Year *</label>
                                    <input {...regClass('academicYear')} className={`form-input ${cErrors.academicYear ? 'error' : ''}`} placeholder="e.g. 2024-25" />
                                    {cErrors.academicYear && <p className="form-error">{cErrors.academicYear.message}</p>}
                                </div>
                                <div>
                                    <label className="form-label">Section *</label>
                                    <input {...regClass('section')} className={`form-input ${cErrors.section ? 'error' : ''}`} placeholder="e.g. A, B" />
                                    {cErrors.section && <p className="form-error">{cErrors.section.message}</p>}
                                </div>
                                <div>
                                    <label className="form-label">Total Fee (₹) *</label>
                                    <input {...regClass('totalFee', { valueAsNumber: true })} type="number" min={0} className={`form-input ${cErrors.totalFee ? 'error' : ''}`} placeholder="e.g. 50000" />
                                    {cErrors.totalFee && <p className="form-error">{cErrors.totalFee.message}</p>}
                                </div>
                            </div>

                            {/* Dynamic installment plan */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                        Installment Plan
                                    </p>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                        onClick={() => append({ installmentNo: fields.length + 1, dueDate: '', amount: 0 })}
                                    >
                                        <Plus size={12} /> Add Installment
                                    </button>
                                </div>

                                {fields.map((field, idx) => (
                                    <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
                                        <div>
                                            <label className="form-label">No.</label>
                                            <input
                                                {...regClass(`installmentPlan.${idx}.installmentNo`, { valueAsNumber: true })}
                                                type="number" className="form-input" min={1} readOnly
                                                defaultValue={idx + 1}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Due Date</label>
                                            <input {...regClass(`installmentPlan.${idx}.dueDate`)} type="date" className="form-input" />
                                        </div>
                                        <div>
                                            <label className="form-label">Amount (₹)</label>
                                            <input {...regClass(`installmentPlan.${idx}.amount`, { valueAsNumber: true })} type="number" min={0} className="form-input" placeholder="Amount" />
                                        </div>
                                        <div>
                                            {fields.length > 1 && (
                                                <button type="button" onClick={() => remove(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '8px 4px' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Sum validation */}
                                <div style={{
                                    padding: '10px 14px', borderRadius: 8, fontSize: '0.8125rem',
                                    background: Math.abs(installmentSum - watchedTotalFee) < 0.01 && watchedTotalFee > 0
                                        ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                                    border: `1px solid ${Math.abs(installmentSum - watchedTotalFee) < 0.01 && watchedTotalFee > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                }}>
                                    Installment sum: <strong>{formatCurrency(installmentSum)}</strong>
                                    {watchedTotalFee > 0 && (
                                        <span style={{ color: Math.abs(installmentSum - watchedTotalFee) < 0.01 ? '#10b981' : '#f59e0b', marginLeft: 8 }}>
                                            {Math.abs(installmentSum - watchedTotalFee) < 0.01 ? '✓ Matches total fee' : `(must equal ${formatCurrency(watchedTotalFee)})`}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => { setTab('classes'); resetClass(); }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={classMutation.isPending}>
                                    {classMutation.isPending ? 'Creating...' : 'Create Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            <AnimatePresence />
        </div>
    );
}
