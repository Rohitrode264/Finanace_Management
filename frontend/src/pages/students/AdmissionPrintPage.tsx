import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { studentsService } from '../../api/services/students.service';
import { enrollmentService } from '../../api/services/enrollment.service';
import type { AcademicClass, ClassTemplate } from '../../types';

export function AdmissionPrintPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['student', id],
        queryFn: () => studentsService.getById(id!),
        enabled: !!id,
    });
    
    const { data: enrollRes } = useQuery({
        queryKey: ['student-enrollments', id],
        queryFn: () => enrollmentService.getByStudentId(id!),
        enabled: !!id,
    });

    const student = data?.data?.data;

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading Form...</div>
            </div>
        );
    }

    if (!student) {
        return (
            <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'var(--text-muted)' }}>Admission Record not found.</p>
                <button className="btn-secondary" onClick={() => navigate('/students')} style={{ marginTop: 16 }}>
                    <ArrowLeft size={14} /> Go Back
                </button>
            </div>
        );
    }

    const INST = {
        name: 'NEW CAREER POINT',
        subtitle: 'Quality Education & Guidance Center',
        address: 'Vaibhav Complex, Nagpur, Maharashtra',
        phone: '+91 84469 87338',
        regNo: 'UDYAM-MH-20-0026811',
        gstin: '27ADYPR1897B1ZV',
    };

    const formattedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Find active enrollment
    const enrollments = enrollRes?.data?.data || [];
    const currentEnrollment = enrollments.find(e => e.status === 'ONGOING') || enrollments[0];
    
    let courseLabel = '—';
    if (currentEnrollment) {
        const ac = currentEnrollment.academicClassId as unknown as AcademicClass;
        const t = ac?.templateId as unknown as ClassTemplate;
        if (t) {
            courseLabel = `${t.grade}${t.stream ? ` — ${t.stream}` : ''} (${t.board})`;
            if (ac.section) courseLabel += ` — Sec ${ac.section}`;
        }
    }

    const creatorName = student.createdBy && typeof student.createdBy === 'object' ? (student.createdBy as any).name || 'Administrator' : 'Administrator';

    // A4 printing layout setup
    return (
        <>
            <style>{`
                .ncp-receipt {
                    width: 100%;
                    max-width: 720px;
                    margin: 0 auto;
                    background: #ffffff;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    color: #111827;
                    box-sizing: border-box;
                }
                .label-title {
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #6b7280;
                    margin-bottom: 3px;
                }
                .value-text {
                    font-size: 14px;
                    font-weight: 700;
                    color: #111827;
                    line-height: 1.3;
                }

                /* ── Mobile responsiveness ── */
                @media (max-width: 640px) {
                    .screen-only { flex-direction: column; }
                    .ncp-receipt { padding: 16px 12px !important; }
                    .ncp-receipt-header { flex-direction: column !important; gap: 20px !important; }
                    .ncp-receipt-header-meta { text-align: left !important; width: 100% !important; }
                    .ncp-receipt-info-grid { grid-template-columns: 1fr !important; }
                    .ncp-receipt-footer { flex-direction: column !important; align-items: center !important; gap: 32px !important; }
                    .ncp-receipt-footer > div { width: 100% !important; }
                }

                /* ── Print rules ── */
                @media print {
                    body {
                        visibility: hidden;
                        background: white !important;
                    }
                    
                    .screen-only {
                        display: none !important;
                    }

                    .ncp-receipt-print-wrapper { 
                        visibility: visible !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                    }

                    .ncp-receipt {
                        max-width: 100% !important;
                        padding: 8mm 12mm !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }
                }
            `}</style>
            
            <div className="screen-only" style={{ maxWidth: 720, margin: '20px auto 20px', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={15}/> Back</button>
                <button className="btn-primary" onClick={() => window.print()}><Printer size={15}/> Print Card</button>
            </div>

            <div className="ncp-receipt ncp-receipt-print-wrapper">
                
                {/* ═══════════════════════  HEADER  ══════════════════════════ */}
                <div className="ncp-receipt-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    paddingBottom: 16,
                    borderBottom: '2px solid #111827',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <img
                            src="/images/logo_bw.jpg"
                            alt="Logo"
                            style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 6 }}
                        />
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', lineHeight: 1 }}>
                                {INST.name}
                            </div>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', marginTop: 3 }}>
                                {INST.subtitle}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#6b7280', marginTop: 3 }}>
                                {INST.address} &nbsp;|&nbsp; {INST.phone}
                            </div>
                            <div style={{ fontSize: 9.5, color: '#9ca3af', marginTop: 2, display: 'flex', gap: 12 }}>
                                <span>Reg. No: <strong style={{ color: '#6b7280' }}>{INST.regNo}</strong></span>
                                <span>GSTIN: <strong style={{ color: '#6b7280' }}>{INST.gstin}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="ncp-receipt-header-meta" style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                            display: 'inline-block',
                            border: '1.5px solid #111827',
                            borderRadius: 4,
                            padding: '3px 12px',
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: '#111827',
                            marginBottom: 8,
                        }}>
                            Admission Form
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
                            {student.admissionNumber}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#374151', fontWeight: 600, marginTop: 2 }}>
                            {formattedDate}
                        </div>
                    </div>
                </div>

                {/* ══════════════  STUDENT PROFILE DETAILS  ═══════════ */}
                <div style={{ margin: '24px 0', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', fontWeight: 800, paddingLeft: 2 }}>
                    Primary Details
                </div>
                
                <div className="ncp-receipt-info-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 0,
                    margin: '8px 0 24px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    overflow: 'hidden',
                }}>
                    <div style={{ padding: '14px 16px', background: '#f9fafb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                        <div className="label-title">Student Name</div>
                        <div className="value-text">{student.firstName} {student.lastName}</div>
                    </div>
                    <div style={{ padding: '14px 16px', background: '#f9fafb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                        <div className="label-title">Date of Birth</div>
                        <div className="value-text">{student.dob || '—'}</div>
                    </div>
                    <div style={{ padding: '14px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <div className="label-title">Blood Group</div>
                        <div className="value-text">{student.bloodGroup || '—'}</div>
                    </div>
                    
                    <div style={{ padding: '14px 16px', background: '#ffffff', borderRight: '1px solid #e5e7eb' }}>
                        <div className="label-title">Primary Phone</div>
                        <div className="value-text">{student.phone}</div>
                    </div>
                    <div style={{ padding: '14px 16px', background: '#ffffff', borderRight: '1px solid #e5e7eb' }}>
                        <div className="label-title">Alternate Phone</div>
                        <div className="value-text">{student.alternatePhone || student.motherPhone || '—'}</div>
                    </div>
                    <div style={{ padding: '14px 16px', background: '#ffffff' }}>
                        <div className="label-title">Email</div>
                        <div className="value-text" style={{ fontSize: 13, wordBreak: 'break-all' }}>{student.email || '—'}</div>
                    </div>
                </div>

                <div style={{ margin: '24px 0 8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', fontWeight: 800, paddingLeft: 2 }}>
                    Parental & Academic Details
                </div>
                
                <div style={{
                    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 0,
                    border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden'
                }}>
                    <div style={{ padding: '14px 16px', background: '#f9fafb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                        <div className="label-title">Father's Name</div>
                        <div className="value-text">{student.fatherName}</div>
                    </div>
                    <div style={{ padding: '14px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <div className="label-title">Mother's Name</div>
                        <div className="value-text">{student.motherName || '—'}</div>
                    </div>

                    <div style={{ gridColumn: 'span 2', padding: '14px 16px', background: '#ffffff' }}>
                        <div className="label-title">Previous School</div>
                        <div className="value-text">{student.schoolName || '—'}</div>
                    </div>

                    <div style={{ gridColumn: 'span 2', padding: '14px 16px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                        <div className="label-title">Enrolled in (Course/Class)</div>
                        <div className="value-text" style={{ fontSize: 16, color: '#6366f1' }}>{courseLabel}</div>
                    </div>

                    <div style={{ gridColumn: 'span 2', padding: '14px 16px', background: '#ffffff' }}>
                        <div className="label-title">Residential Address</div>
                        <div className="value-text" style={{ fontWeight: 600 }}>
                            {student.address?.street ? student.address.street + ', ' : ''}
                            {student.address?.city ? student.address.city + ', ' : ''}
                            {student.address?.state ? student.address.state : '—'} 
                            {student.address?.zipCode ? ' - ' + student.address.zipCode : ''}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════  FOOTER  ═══════════════════════════ */}
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '48px 0 20px' }} />
                
                <div className="ncp-receipt-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ textAlign: 'center', minWidth: 160 }}>
                        <div style={{ height: 36 }} />
                        <div style={{ borderTop: '1px solid #374151', paddingTop: 6 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151' }}>
                                Parent / Guardian Signature
                            </div>
                        </div>
                    </div>

                    <div style={{
                        width: 64, height: 64,
                        border: '2px solid #e5e7eb',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: 'rotate(-5deg)', color: '#d1d5db',
                        fontSize: 10, fontWeight: 900, textAlign: 'center', letterSpacing: '0.02em',
                        padding: 4
                    }}>
                        OFFICE<br/>USE
                    </div>

                    <div style={{ textAlign: 'center', minWidth: 160 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                            {creatorName}
                        </div>
                        <div style={{ borderTop: '1px solid #374151', paddingTop: 6 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151' }}>
                                Authorized Signatory
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 10, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 9.5, color: '#9ca3af', fontWeight: 500, textAlign: 'left' }}>
                        Registered By: {creatorName}
                    </div>
                    <div style={{ fontSize: 9.5, color: '#9ca3af', fontWeight: 500, textAlign: 'right' }}>
                        This document serves as proof of admission record. Keep safe for future reference. &nbsp;|&nbsp; © {new Date().getFullYear()} {INST.name}
                    </div>
                </div>
            </div>
        </>
    );
}
