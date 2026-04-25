import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { useSilentPrint } from '../../hooks/useSilentPrint';
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

    const { handlePrint, isPrinting } = useSilentPrint({
        contentRef: printRef,
        docType: 'admission'
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

    // A4 printing layout setup - premium table-based design for bulletproof printing
    return (
        <>
            <div className="screen-only no-print" style={{ maxWidth: 794, margin: '20px auto', display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '0 20px' }}>
                <button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={15}/> Back</button>
                <button className="btn-primary" onClick={handlePrint} disabled={isPrinting}>
                    <Printer size={15}/> {isPrinting ? 'Printing...' : 'Print Form'}
                </button>
            </div>

            <div className="ncp-receipt" ref={printRef}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
                    
                    .ncp-receipt {
                        width: 100%;
                        max-width: 794px; /* A4 width roughly at 96dpi */
                        margin: 0 auto;
                        background: #ffffff !important;
                        font-family: 'Outfit', system-ui, -apple-system, sans-serif;
                        color: #000000 !important;
                        box-sizing: border-box;
                    }
                    
                    .ncp-receipt * {
                        border-color: #000000 !important;
                    }

                    .form-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 24px;
                        border: 2px solid #000000;
                    }

                    .form-table td {
                        border: 1px solid #000000;
                        padding: 12px 16px;
                        vertical-align: top;
                    }

                    .form-table td.bg-fill {
                        background-color: #fafafa !important;
                    }

                    .label-title {
                        font-size: 10px;
                        font-weight: 700;
                        letter-spacing: 0.1em;
                        text-transform: uppercase;
                        color: #4a4a4a !important; /* Slightly softened black for labels */
                        margin-bottom: 6px;
                    }

                    .value-text {
                        font-size: 15px;
                        font-weight: 800;
                        color: #000000 !important;
                        line-height: 1.3;
                    }

                    @media print {
                        .ncp-receipt {
                            max-width: 100% !important;
                            padding: 12mm !important;
                            box-shadow: none !important;
                            border: none !important;
                        }
                    }
                `}</style>
                
                {/* ═══════════════════════  HEADER  ══════════════════════════ */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    paddingBottom: 20,
                    borderBottom: '3px solid #000000',
                    marginBottom: 24
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <img
                            src="/images/logo_bw.jpg"
                            alt="Logo"
                            style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8, border: '2px solid #000' }}
                        />
                        <div>
                            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: '#000000', lineHeight: 1, marginBottom: 6 }}>
                                {INST.name}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#333333', marginBottom: 4 }}>
                                {INST.subtitle}
                            </div>
                            <div style={{ fontSize: 11, color: '#444444', marginBottom: 4 }}>
                                {INST.address}  |  {INST.phone}
                            </div>
                            <div style={{ fontSize: 10, color: '#555555', display: 'flex', gap: 16, fontWeight: 600 }}>
                                <span>Reg. No: {INST.regNo}</span>
                                <span>GSTIN: {INST.gstin}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginTop: 4 }}>
                            <div style={{
                                display: 'inline-block',
                                border: '2px solid #000000',
                                borderRadius: 6,
                                padding: '6px 16px',
                                fontSize: 12,
                                fontWeight: 900,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: '#000000',
                                marginBottom: 16,
                                background: '#fafafa !important'
                            }}>
                                Admission Form
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#000000', letterSpacing: '-0.02em', marginBottom: 6 }}>
                                {student.admissionNumber}
                            </div>
                            <div style={{ fontSize: 13, color: '#000000', fontWeight: 700 }}>
                                {formattedDate}
                            </div>
                        </div>

                        <div style={{
                            width: '100px',
                            height: '130px',
                            border: '2px dashed #000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '10px'
                        }}>
                            <span style={{ fontSize: 10, color: '#444', fontWeight: 700 }}>Affix Passport Size Photo Here</span>
                        </div>
                    </div>
                </div>

                {/* ══════════════  STUDENT PROFILE DETAILS  ═══════════ */}
                <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#000', fontWeight: 900, marginBottom: 12, borderLeft: '4px solid #000', paddingLeft: 8 }}>
                    Primary Details
                </div>
                
                <table className="form-table">
                    <tbody>
                        <tr>
                            <td colSpan={2} className="bg-fill" style={{ width: '66%' }}>
                                <div className="label-title">Student Full Name</div>
                                <div className="value-text" style={{ fontSize: 18 }}>{student.firstName} {student.lastName}</div>
                            </td>
                            <td style={{ width: '34%' }}>
                                <div className="label-title">Date of Birth</div>
                                <div className="value-text">{student.dob ? new Date(student.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not Provided'}</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="bg-fill">
                                <div className="label-title">Primary Phone</div>
                                <div className="value-text">{student.phone}</div>
                            </td>
                            <td>
                                <div className="label-title">Alternate Phone</div>
                                <div className="value-text">{student.alternatePhone || student.motherPhone || 'Not Provided'}</div>
                            </td>
                            <td className="bg-fill">
                                <div className="label-title">Blood Group</div>
                                <div className="value-text">{student.bloodGroup || 'Not Provided'}</div>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={3}>
                                <div className="label-title">Email Address</div>
                                <div className="value-text">{student.email || 'Not Provided'}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#000', fontWeight: 900, marginBottom: 12, borderLeft: '4px solid #000', paddingLeft: 8, marginTop: 32 }}>
                    Parental & Academic Details
                </div>
                
                <table className="form-table">
                    <tbody>
                        <tr>
                            <td className="bg-fill" style={{ width: '50%' }}>
                                <div className="label-title">Father's Name</div>
                                <div className="value-text">{student.fatherName}</div>
                            </td>
                            <td style={{ width: '50%' }}>
                                <div className="label-title">Mother's Name</div>
                                <div className="value-text">{student.motherName || 'Not Provided'}</div>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2} className="bg-fill">
                                <div className="label-title">Current School Name</div>
                                <div className="value-text" style={{ fontSize: 16 }}>{student.schoolName || 'Not Provided'}</div>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2}>
                                <div className="label-title">Enrolled In (Course / Class)</div>
                                <div className="value-text" style={{ fontSize: 18, fontWeight: 900 }}>{courseLabel}</div>
                            </td>
                        </tr>
                        
                        {currentEnrollment && (
                            <tr>
                                <td colSpan={2} className="bg-fill">
                                    <div className="label-title">Fee Details (Academic Tuition)</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: '#000' }}>
                                            {formatCurrency(currentEnrollment.netFee)}
                                        </div>
                                        {currentEnrollment.totalFee > currentEnrollment.netFee && (
                                            <div style={{ fontSize: 12, color: '#444', fontWeight: 600, textAlign: 'right' }}>
                                                Base Fee: {formatCurrency(currentEnrollment.totalFee)}<br/>
                                                Concession: {formatCurrency(currentEnrollment.totalFee - currentEnrollment.netFee)}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                        <tr>
                            <td colSpan={2}>
                                <div className="label-title">Residential Address</div>
                                <div className="value-text" style={{ fontWeight: 600, lineHeight: 1.5 }}>
                                    {student.address?.street ? student.address.street + ', ' : ''}
                                    {student.address?.city ? student.address.city + ', ' : ''}
                                    {student.address?.state ? student.address.state : 'Not Provided'} 
                                    {student.address?.zipCode ? ' - ' + student.address.zipCode : ''}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ═══════════════════════  FOOTER  ═══════════════════════════ */}
                <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ textAlign: 'center', minWidth: 200 }}>
                        <div style={{ borderTop: '2px solid #000000', paddingTop: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000' }}>
                                Parent / Guardian Signature
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', minWidth: 200 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#000', marginBottom: 8 }}>
                            {creatorName}
                        </div>
                        <div style={{ borderTop: '2px solid #000000', paddingTop: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000' }}>
                                Authorized Signatory
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 40, paddingTop: 16, borderTop: '2px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 10, color: '#333', fontWeight: 600 }}>
                        Registered By: {creatorName}
                    </div>
                    <div style={{ fontSize: 10, color: '#333', fontWeight: 600 }}>
                        This document serves as proof of admission record. Keep safe for future reference.  |  © {new Date().getFullYear()} {INST.name}
                    </div>
                </div>
            </div>
        </>
    );
}
