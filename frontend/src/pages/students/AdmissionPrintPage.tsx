import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { studentsService } from '../../api/services/students.service';
import { enrollmentService } from '../../api/services/enrollment.service';
import { formatCurrency } from '../../utils/currency';
import type { AcademicClass, ClassTemplate } from '../../types';

export function AdmissionPrintPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const printRef = useRef<HTMLDivElement>(null);

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

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `AdmissionForm_${id}`,
        pageStyle: `@page { size: A5 portrait; margin: 10mm 10mm 12mm 14mm; }`,
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
    const currentEnrollment = enrollments.find((e: any) => e.status === 'ONGOING') || enrollments[0];

    let courseLabel = '—';
    if (currentEnrollment) {
        const ac = currentEnrollment.academicClassId as unknown as AcademicClass;
        const t = ac?.templateId as unknown as ClassTemplate;
        if (t) {
            courseLabel = `${t.grade}${t.stream ? ` (${t.stream})` : ''}${t.board ? ` — ${t.board}` : ''}`;
            if (ac.section) courseLabel += ` — Sec ${ac.section}`;
        }
    }

    const creatorName = student.createdBy && typeof student.createdBy === 'object' ? (student.createdBy as any).name || 'Administrator' : 'Administrator';

    const label = (extra?: React.CSSProperties): React.CSSProperties => ({
        fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#6b7280', marginBottom: 3,
        ...extra,
    });

    return (
        <>
            <div className="screen-only no-print" style={{ maxWidth: 600, margin: '20px auto', display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '0 20px' }}>
                <button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button>
                <button className="btn-primary" onClick={() => handlePrint()}>
                    <Printer size={15} /> Print Form (A5)
                </button>
            </div>

            <div className="r-wrap" ref={printRef}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                    
                    .r-wrap {
                        width: 100%;
                        max-width: 560px;
                        margin: 0 auto;
                        padding: 18px 16px 18px 20px;
                        background: #fff !important;
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        color: #111827 !important;
                        box-sizing: border-box;
                    }

                    @media print {
                        .r-wrap {
                            width: 148mm !important;
                            max-width: 148mm !important;
                            margin: 0 auto !important;
                            padding: 0 !important; /* Relying solely on @page margin */
                            box-shadow: none !important;
                            border: none !important;
                            background: #fff !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            overflow: visible !important;
                        }

                        body { background: #fff !important; }
                        
                        .r-hdr, .r-sig, .r-hdr-brand, .r-hdr-regs {
                            display: flex !important;
                            flex-direction: row !important;
                        }

                        .r-hdr, .r-sig {
                            justify-content: space-between !important;
                        }

                        .r-hdr-brand {
                            align-items: center !important;
                            gap: 10px !important;
                        }

                        .r-hdr-regs {
                            gap: 10px !important;
                        }

                        .r-sig {
                            align-items: flex-end !important;
                        }
                    }
                `}</style>

                {/* ── HEADER ────────────────────────────────────────────────── */}
                <div className="r-hdr" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: 12, borderBottom: '2.5px solid #111827', marginBottom: 12,
                }}>
                    {/* Branding */}
                    <div className="r-hdr-brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                            src="/images/logo_bw.jpg" alt="Logo"
                            style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 5 }}
                        />
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', lineHeight: 1 }}>
                                {INST.name}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginTop: 3 }}>
                                {INST.subtitle}
                            </div>
                            <div style={{ fontSize: 9, color: '#6b7280', marginTop: 3 }}>
                                {INST.address}&nbsp;|&nbsp;{INST.phone}
                            </div>
                            <div className="r-hdr-regs" style={{ fontSize: 8, color: '#9ca3af', marginTop: 3, display: 'flex', gap: 10 }}>
                                <span>Reg: <strong style={{ color: '#6b7280' }}>{INST.regNo}</strong></span>
                                <span>GSTIN: <strong style={{ color: '#6b7280' }}>{INST.gstin}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {/* Larger Photo Box */}
                        <div style={{
                            width: 75, height: 95, border: '1.5px dashed #6b7280', borderRadius: 5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            textAlign: 'center', background: '#f9fafb', flexShrink: 0
                        }}>
                            <span style={{ fontSize: 8.5, color: '#9ca3af', fontWeight: 700, letterSpacing: '0.05em' }}>AFFIX<br/>PHOTO</span>
                        </div>
                    </div>
                </div>

                {/* ── FORM META BAR ─────────────────────────────────────── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f9fafb', padding: '8px 12px',
                    border: '1.5px solid #e5e7eb', borderRadius: 5, marginBottom: 16
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', minWidth: 100 }}>
                        <span style={{ fontSize: 8, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em', display: 'block', marginBottom: 2 }}>CP ID</span>
                        {student.admissionNumber}
                    </div>
                    
                    <div style={{
                        fontSize: 12, fontWeight: 800, letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: '#111827', textAlign: 'center'
                    }}>
                        Admission Form
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', minWidth: 100, textAlign: 'right' }}>
                        <span style={{ fontSize: 8, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em', display: 'block', marginBottom: 2 }}>Date</span>
                        {formattedDate}
                    </div>
                </div>

                {/* ── STUDENT DETAILS ───────────────────────── */}
                <div style={label({ color: '#111827', marginBottom: 4 })}>Personal Details</div>
                <div className="r-info" style={{
                    display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr)',
                    gap: 0, marginBottom: 14,
                    border: '1.5px solid #e5e7eb', borderRadius: 5, overflow: 'hidden',
                }}>
                    <div style={{ padding: '8px 10px', background: '#f9fafb', borderRight: '1.5px solid #e5e7eb', borderBottom: '1.5px solid #e5e7eb' }}>
                        <div style={label()}>Student Name</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                            {student?.firstName} {student?.lastName}
                        </div>
                    </div>
                    <div style={{ padding: '8px 10px', background: '#fff', borderRight: '1.5px solid #e5e7eb', borderBottom: '1.5px solid #e5e7eb' }}>
                        <div style={label()}>Date of Birth</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                            {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'N/A'}
                        </div>
                    </div>
                    <div style={{ padding: '8px 10px', background: '#fff', borderBottom: '1.5px solid #e5e7eb' }}>
                        <div style={label()}>Blood Group</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', lineHeight: 1.2 }}>
                            {student.bloodGroup || 'N/A'}
                        </div>
                    </div>

                    <div style={{ padding: '8px 10px', background: '#fff', borderRight: '1.5px solid #e5e7eb' }}>
                        <div style={label()}>Email Address</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {student.email || 'N/A'}
                        </div>
                    </div>
                    <div style={{ padding: '8px 10px', background: '#fff', borderRight: '1.5px solid #e5e7eb' }}>
                        <div style={label()}>Primary Phone</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                            {student.phone}
                        </div>
                    </div>
                    <div style={{ padding: '8px 10px', background: '#fff' }}>
                        <div style={label()}>Alt. Phone</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', lineHeight: 1.2 }}>
                            {student.alternatePhone || student.motherPhone || 'N/A'}
                        </div>
                    </div>
                </div>

                {/* ── PARENTAL & ACADEMIC ───────────────────────── */}
                <div style={label({ color: '#111827', marginBottom: 4 })}>Academic & Family Info</div>
                <div className="r-info" style={{
                    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                    gap: 0, marginBottom: 14,
                    border: '1.5px solid #e5e7eb', borderRadius: 5, overflow: 'hidden',
                }}>
                    <div style={{ padding: '8px 10px', background: '#fff', borderRight: '1.5px solid #e5e7eb', borderBottom: '1.5px solid #e5e7eb' }}>
                        <div style={label()}>Father's Name</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                            {student.fatherName}
                        </div>
                    </div>
                    <div style={{ padding: '8px 10px', background: '#fff', borderBottom: '1.5px solid #e5e7eb' }}>
                        <div style={label()}>Mother's Name</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                            {student.motherName || 'N/A'}
                        </div>
                    </div>

                    <div style={{ padding: '8px 10px', background: '#fff', borderRight: '1.5px solid #e5e7eb', gridColumn: 'span 2', borderBottom: '1.5px solid #e5e7eb' }}>
                        <div style={label()}>Current / Previous School Name</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                            {student.schoolName || 'N/A'}
                        </div>
                    </div>

                    <div style={{ padding: '8px 10px', background: '#f9fafb', gridColumn: 'span 2', borderBottom: '1.5px solid #e5e7eb' }}>
                        <div style={label()}>Enrolled Program (Course / Class)</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
                            {courseLabel}
                        </div>
                        <div style={{ fontSize: 9, color: '#6b7280', marginTop: 3, fontWeight: 600 }}>
                            Session: {currentEnrollment?.academicYear || 'N/A'}
                        </div>
                    </div>

                    <div style={{ padding: '8px 10px', background: '#fff', gridColumn: 'span 2' }}>
                        <div style={label()}>Residential Address</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', lineHeight: 1.3 }}>
                            {student.address?.street ? student.address.street + ', ' : ''}
                            {student.address?.city ? student.address.city + ', ' : ''}
                            {student.address?.state ? student.address.state : 'N/A'}
                            {student.address?.zipCode ? ' - ' + student.address.zipCode : ''}
                        </div>
                    </div>
                </div>

                {/* ── FEE SUMMARY TABLE ────────────────────────── */}
                {currentEnrollment && (
                    <div className="r-fin" style={{ marginBottom: 16 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #e5e7eb', borderRadius: 5 }}>
                            <thead>
                                <tr style={{ background: '#f9fafb' }}>
                                    <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 8, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1.5px solid #e5e7eb' }}>
                                        Academic Fee Description
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 8, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1.5px solid #e5e7eb' }}>
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '10px 10px 4px', fontSize: 13, fontWeight: 600, color: '#111827' }}>
                                        Base Course Fee
                                    </td>
                                    <td style={{ padding: '10px 10px 4px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#111827' }}>
                                        {formatCurrency(currentEnrollment.totalFee || currentEnrollment.netFee)}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 10px 8px', fontSize: 12, fontWeight: 500, color: '#374151', borderBottom: '1.5px dashed #e5e7eb' }}>
                                        Concession Applied
                                    </td>
                                    <td style={{ padding: '4px 10px 8px', fontSize: 12, fontWeight: 600, textAlign: 'right', color: '#059669', borderBottom: '1.5px dashed #e5e7eb' }}>
                                        - {formatCurrency((currentEnrollment.totalFee || currentEnrollment.netFee) - currentEnrollment.netFee)}
                                    </td>
                                </tr>
                                <tr style={{ background: '#ecfdf5' }}>
                                    <td style={{ padding: '10px 10px', fontSize: 14, fontWeight: 800, color: '#059669' }}>
                                        Net Payable Academic Fee
                                    </td>
                                    <td style={{ padding: '10px 10px', fontSize: 15, fontWeight: 900, textAlign: 'right', color: '#059669' }}>
                                        {formatCurrency(currentEnrollment.netFee)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── FOOTER (signatures + stamp) ──────────────────────────── */}
                <hr style={{ border: 'none', borderTop: '1.5px solid #e5e7eb', margin: '20px 0 14px' }} />
                <div className="r-sig" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 8px' }}>

                    {/* Parent signature */}
                    <div style={{ textAlign: 'center', minWidth: 120 }}>
                        <div style={{ height: 32 }} />
                        <div style={{ borderTop: '1.5px solid #374151', paddingTop: 6 }}>
                            <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151' }}>
                                Parent / Guardian
                            </div>
                        </div>
                    </div>

                    {/* Authorized signatory */}
                    <div style={{ textAlign: 'center', minWidth: 120 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                            {creatorName}
                        </div>
                        <div style={{ borderTop: '1.5px solid #374151', paddingTop: 6 }}>
                            <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151' }}>
                                Authorized Signatory
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── DISCLAIMER ───────────────────────────────────────────── */}
                <div style={{ marginTop: 18, paddingTop: 8, borderTop: '1.5px solid #e5e7eb', textAlign: 'center' }}>
                    <p style={{ fontSize: 8, color: '#9ca3af', margin: 0, fontWeight: 500 }}>
                        Keep this document safe for future reference.&nbsp;|&nbsp;© {new Date().getFullYear()} {INST.name}
                    </p>
                </div>
            </div>
        </>
    );
}
