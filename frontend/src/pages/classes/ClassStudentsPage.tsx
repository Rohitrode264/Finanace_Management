import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Filter, CreditCard, User, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { classesService } from '../../api/services/classes.service';
import apiClient from '../../api/client';
import { formatCurrency } from '../../utils/currency';
import type { AcademicClass, ClassTemplate } from '../../types';
import * as XLSX from 'xlsx';

export function ClassStudentsPage() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
    const [filterPaidInstallments, setFilterPaidInstallments] = useState<number | 'all'>('all');

    const { data: classRes, isLoading: cLoading } = useQuery({
        queryKey: ['academic-class', classId],
        queryFn: () => classesService.getClass(classId!),
        enabled: !!classId,
    });

    const { data: enrollmentsRes, isLoading: eLoading } = useQuery({
        queryKey: ['class-enrollments', classId],
        queryFn: () => apiClient.get(`/enrollments?classId=${classId}&limit=500`),
        enabled: !!classId,
    });

    const academicClass = classRes?.data?.data as AcademicClass | undefined;
    const enrollments = (enrollmentsRes?.data?.data || []) as any[];

    const tmpl = academicClass && typeof academicClass.templateId === 'object'
        ? academicClass.templateId as ClassTemplate
        : null;

    const filteredEnrollments = enrollments.filter(e => {
        // Don't show transferred/cancelled students in the active class list
        if (e.status === 'CANCELLED') return false;

        const fullName = `${e.studentId?.firstName} ${e.studentId?.lastName}`.toLowerCase();
        const admissionNumber = (e.studentId?.admissionNumber || '').toLowerCase();
        const matchesSearch = fullName.includes(search.toLowerCase()) || admissionNumber.includes(search.toLowerCase());

        if (!matchesSearch) return false;

        // Calculate paid installments
        const paid = e.netFee - (e.outstandingBalance ?? 0);
        let paidCount = 0;
        let tempPaid = paid;
        const plan = [...(academicClass?.installmentPlan || [])].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        for (const ins of plan) {
            if (tempPaid >= ins.amount - 0.01) {
                paidCount++;
                tempPaid -= ins.amount;
            } else { break; }
        }

        if (filterPaidInstallments !== 'all' && paidCount !== filterPaidInstallments) return false;

        if (filterStatus === 'paid') return (e.outstandingBalance ?? 0) <= 0;
        if (filterStatus === 'pending') return (e.outstandingBalance ?? 0) > 0;
        return true;
    });

    const stats = {
        total: enrollments.length,
        paid: enrollments.filter(e => (e.outstandingBalance ?? 0) <= 0).length,
        pending: enrollments.filter(e => (e.outstandingBalance ?? 0) > 0).length,
    };

    const downloadExcel = () => {
        if (!academicClass || filteredEnrollments.length === 0) return;

        // Calculate totals
        const totalFee = filteredEnrollments.reduce((sum, e) => sum + e.netFee, 0);
        const totalOutstanding = filteredEnrollments.reduce((sum, e) => sum + (e.outstandingBalance ?? 0), 0);
        const totalPaid = totalFee - totalOutstanding;
        const collectionProgress = totalFee > 0 ? (totalPaid / totalFee) * 100 : 0;

        const data: any[] = [];
        
        // Title Block
        data.push([{ v: "NEW CAREER POINT", t: "s" }]);
        data.push([{ v: "PROGRAM STUDENT ENROLLMENT REPORT", t: "s" }]);
        data.push([]);

        // Program Details
        data.push(["Program / Class:", tmpl ? `${tmpl.grade}${tmpl.stream ? ` – ${tmpl.stream}` : ''}${tmpl.board ? ` (${tmpl.board})` : ''}` : "Class Students"]);
        data.push(["Section:", academicClass.section || '—']);
        data.push(["Academic Year:", academicClass.academicYear || '—']);
        data.push(["Generated On:", new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })]);
        data.push([]);

        // Summary Statistics
        data.push(["SUMMARY STATISTICS"]);
        data.push(["Total Students in Export:", filteredEnrollments.length]);
        data.push(["Total Fees (Net):", { v: totalFee, t: "n", z: '"₹"#,##0' }]);
        data.push(["Total Paid:", { v: totalPaid, t: "n", z: '"₹"#,##0' }]);
        data.push(["Total Outstanding:", { v: totalOutstanding, t: "n", z: '"₹"#,##0' }]);
        data.push(["Collection Progress:", `${collectionProgress.toFixed(1)}%`]);
        data.push([]);

        // Table Headers
        data.push([
            "S.No.",
            "Student Name",
            "Admission Number",
            "Status",
            "Net Fee",
            "Paid",
            "Outstanding",
            "Paid Installments",
            "Total Installments",
            "Payment Status"
        ]);

        // Student Data Rows
        filteredEnrollments.forEach((e, idx) => {
            const studentName = `${e.studentId?.firstName || ''} ${e.studentId?.lastName || ''}`.trim();
            const admissionNo = e.studentId?.admissionNumber || '—';
            const status = e.studentId?.status || '—';
            const netFee = e.netFee;
            const paid = e.netFee - (e.outstandingBalance ?? 0);
            const outstanding = e.outstandingBalance ?? 0;
            
            // Calculate paid installments
            let paidInstallments = 0;
            let tempPaid = paid;
            const plan = [...(academicClass.installmentPlan || [])].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            for (const ins of plan) {
                if (tempPaid >= ins.amount - 0.01) {
                    paidInstallments++;
                    tempPaid -= ins.amount;
                } else {
                    break;
                }
            }
            const totalInstallments = plan.length;
            
            let paymentStatus = 'Unpaid';
            if (outstanding <= 0) {
                paymentStatus = 'Cleared';
            } else if (paid > 0) {
                paymentStatus = 'Partial';
            }

            data.push([
                idx + 1,
                studentName,
                admissionNo,
                status,
                { v: netFee, t: "n", z: '"₹"#,##0' },
                { v: paid, t: "n", z: '"₹"#,##0' },
                { v: outstanding, t: "n", z: '"₹"#,##0' },
                paidInstallments,
                totalInstallments,
                paymentStatus
            ]);
        });

        // Totals Row
        data.push([]);
        data.push([
            "TOTALS",
            "",
            "",
            "",
            { v: totalFee, t: "n", z: '"₹"#,##0' },
            { v: totalPaid, t: "n", z: '"₹"#,##0' },
            { v: totalOutstanding, t: "n", z: '"₹"#,##0' },
            "",
            "",
            ""
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students List");

        // Column widths
        worksheet["!cols"] = [
            { wch: 8 },  // S.No
            { wch: 28 }, // Student Name
            { wch: 18 }, // Admission Number
            { wch: 12 }, // Status
            { wch: 14 }, // Net Fee
            { wch: 14 }, // Paid
            { wch: 14 }, // Outstanding
            { wch: 18 }, // Paid Installments
            { wch: 18 }, // Total Installments
            { wch: 16 }  // Payment Status
        ];

        // Merge title rows
        worksheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }
        ];

        const className = tmpl ? `${tmpl.grade}${tmpl.stream ? `_${tmpl.stream}` : ''}` : 'Class';
        const section = academicClass.section ? `_${academicClass.section}` : '';
        const fileName = `NCP_${className}${section}_Students_${new Date().toISOString().split('T')[0]}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            <button
                onClick={() => navigate('/classes')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', color: 'var(--text-secondary)',
                    cursor: 'pointer', marginBottom: 16, fontSize: '0.875rem', fontWeight: 500
                }}
            >
                <ArrowLeft size={16} /> Back to Classes
            </button>

            <PageHeader
                title={tmpl ? `Class ${tmpl.grade}${tmpl.stream ? ` – ${tmpl.stream}` : ''}${tmpl.board ? ` (${tmpl.board})` : ''}` : 'Class Students'}
                subtitle={`${academicClass?.section || ''} | ${academicClass?.academicYear || ''} Enrollment List`}
                actions={
                    <button
                        className="btn-primary"
                        onClick={downloadExcel}
                        disabled={!academicClass || filteredEnrollments.length === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <FileSpreadsheet size={16} />
                        Export Excel
                    </button>
                }
            />

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Students</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.total}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Fully Paid</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.paid}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Filter size={22} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Outstanding</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.pending}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Search by name or admission number..."
                    />
                </div>

                {/* Installment Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Installments Paid:</label>
                    <select
                        className="form-select"
                        style={{ width: 140, padding: '6px 10px' }}
                        value={filterPaidInstallments}
                        onChange={(e) => setFilterPaidInstallments(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    >
                        <option value="all">All</option>
                        {academicClass?.installmentPlan?.map((_, i) => (
                            <option key={i} value={i + 1}>{i + 1} Installment{i > 0 ? 's' : ''}</option>
                        ))}
                        <option value={0}>0 Installments</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    {(['all', 'paid', 'pending'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            style={{
                                padding: '8px 16px', borderRadius: 8, border: '1px solid',
                                fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s',
                                borderColor: filterStatus === s ? '#6366f1' : 'var(--border)',
                                background: filterStatus === s ? '#6366f1' : 'transparent',
                                color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
                            }}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Students Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Admission No.</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Total Fee</th>
                                <th style={{ textAlign: 'right' }}>Paid</th>
                                <th style={{ textAlign: 'right' }}>Outstanding</th>
                                <th>Installments</th>
                                <th style={{ textAlign: 'center' }}>Ledger</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eLoading || cLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                                        <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                                    ))}</tr>
                                ))
                            ) : filteredEnrollments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                                        No students found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredEnrollments.map((e) => {
                                    const paid = e.netFee - (e.outstandingBalance ?? 0);
                                    let paidInstallments = 0;
                                    let tempPaid = paid;
                                    const plan = [...(academicClass?.installmentPlan || [])].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                                    for (const ins of plan) {
                                        if (tempPaid >= ins.amount - 0.01) {
                                            paidInstallments++;
                                            tempPaid -= ins.amount;
                                        } else {
                                            break;
                                        }
                                    }

                                    return (
                                        <tr key={e._id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {e.studentId?.firstName} {e.studentId?.lastName}
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                {e.studentId?.admissionNumber}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600,
                                                    background: e.studentId?.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' :
                                                               e.studentId?.status === 'DROPPED' ? 'rgba(239,68,68,0.1)' : 'var(--bg-muted)',
                                                    color: e.studentId?.status === 'ACTIVE' ? '#10b981' :
                                                           e.studentId?.status === 'DROPPED' ? '#ef4444' : 'var(--text-secondary)',
                                                }}>
                                                    {e.studentId?.status || '—'}
                                                </span>
                                            </td>
                                            <td className="financial-value">{formatCurrency(e.netFee)}</td>
                                            <td className="financial-value" style={{ color: '#10b981' }}>{formatCurrency(paid)}</td>
                                            <td className="financial-value" style={{ color: (e.outstandingBalance ?? 0) > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                                                {formatCurrency(e.outstandingBalance ?? 0)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 3 }}>
                                                    {plan.map((ins, i) => (
                                                        <div key={i} style={{
                                                            width: 18, height: 18, borderRadius: 3,
                                                            background: i < paidInstallments ? '#10b981' : i === paidInstallments && tempPaid > 0 ? '#f59e0b' : 'var(--bg-muted)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff'
                                                        }} title={`Installment ${i + 1}: ${formatCurrency(ins.amount)}`}>
                                                            {i + 1}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={() => navigate(`/ledger?studentId=${e.studentId?._id}&enrollmentId=${e._id}`)}
                                                    className="btn-secondary"
                                                    style={{ padding: '6px 8px', borderRadius: 6 }}
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
