import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Eye, AlertTriangle, Users, TrendingUp, Search, ChevronDown, ChevronRight, Send, Printer, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import { formatCurrency } from '../../utils/currency';
import * as XLSX from 'xlsx';
import apiClient from '../../api/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { downloadElementAsPdf } from '../../utils/reportPdf';

// ── Types ──────────────────────────────────────────────────────────────────────
interface EagleEyeStudentRow {
    name: string;
    admissionNumber: string;
    netFee: number;
    paid: number;
    outstanding: number;
}
interface EagleEyeClassGroup {
    className: string;
    enrolled: number;
    totalFees: number;
    collected: number;
    outstanding: number;
    students: EagleEyeStudentRow[];
}
interface EagleEyeReport {
    generatedAt: string;
    institution: { totalEnrolled: number; totalFees: number; totalCollected: number; totalOutstanding: number; };
    byClass: EagleEyeClassGroup[];
    atRisk: (EagleEyeStudentRow & { className: string })[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const pct = (collected: number, total: number) =>
    total > 0 ? Math.round((collected / total) * 100) : 0;

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, isCurrency = false }:
    { label: string; value: number; sub?: string; color: string; isCurrency?: boolean }) {
    return (
        <div className="stat-card">
            <div className="stat-card-bar" style={{ background: color }} />
            <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    {label}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {isCurrency ? formatCurrency(value) : value.toLocaleString('en-IN')}
                </div>
                {sub && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
            </div>
        </div>
    );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = '#6366f1' }: { value: number; max: number; color?: string }) {
    const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s' }} />
        </div>
    );
}

// ── Class Group Row ───────────────────────────────────────────────────────────
function ClassSection({ group, search }: { group: EagleEyeClassGroup; search: string }) {
    const [open, setOpen] = useState(false);
    const collPct = pct(group.collected, group.totalFees);

    const filtered = useMemo(() => {
        if (!search) return group.students;
        const q = search.toLowerCase();
        return group.students.filter(s => s.name.toLowerCase().includes(q) || s.admissionNumber.toLowerCase().includes(q));
    }, [group.students, search]);

    if (search && filtered.length === 0) return null;

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 10, overflow: 'hidden' }}>
            {/* Header */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', padding: '14px 18px', background: 'var(--bg-subtle)',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    display: 'grid', gridTemplateColumns: '20px 1fr repeat(4,minmax(100px,1fr)) 52px',
                    gap: 12, alignItems: 'center', fontFamily: 'var(--font-sans)',
                }}
            >
                <div style={{ color: 'var(--text-muted)' }}>
                    {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{group.className}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{group.enrolled} students</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Fees</div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{formatCurrency(group.totalFees)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Collected</div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#059669' }}>{formatCurrency(group.collected)}</div>
                    <ProgressBar value={group.collected} max={group.totalFees} color="#059669" />
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Outstanding</div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: group.outstanding > 0 ? '#dc2626' : '#059669' }}>
                        {formatCurrency(group.outstanding)}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Collection %</div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: collPct >= 80 ? '#059669' : collPct >= 50 ? '#d97706' : '#dc2626' }}>
                        {collPct}%
                    </div>
                </div>
            </button>

            {/* Student Table */}
            {open && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                                <th style={{ textAlign: 'left', padding: '10px 18px', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Student</th>
                                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Adm. No.</th>
                                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Fee</th>
                                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Paid</th>
                                <th style={{ textAlign: 'right', padding: '10px 18px', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Outstanding</th>
                                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                    <td style={{ padding: '10px 18px', fontWeight: 600 }}>{s.name}</td>
                                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.admissionNumber}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(s.netFee)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#059669', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(s.paid)}</td>
                                    <td style={{ padding: '10px 18px', textAlign: 'right', color: s.outstanding > 0 ? '#dc2626' : '#059669', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(s.outstanding)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700,
                                            background: s.outstanding <= 0 ? 'rgba(5,150,105,0.1)' : s.outstanding > s.netFee * 0.5 ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                                            color: s.outstanding <= 0 ? '#059669' : s.outstanding > s.netFee * 0.5 ? '#dc2626' : '#d97706',
                                        }}>
                                            {s.outstanding <= 0 ? 'Cleared' : s.outstanding > s.netFee * 0.5 ? 'High Due' : 'Partial'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {/* Totals row */}
                        <tfoot>
                            <tr style={{ background: 'var(--bg-subtle)', borderTop: '2px solid var(--border)' }}>
                                <td colSpan={2} style={{ padding: '10px 18px', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    Class Total ({group.enrolled} students)
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(group.totalFees)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatCurrency(group.collected)}</td>
                                <td style={{ padding: '10px 18px', textAlign: 'right', fontWeight: 700, color: group.outstanding > 0 ? '#dc2626' : '#059669' }}>{formatCurrency(group.outstanding)}</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function EagleEyePage() {
    const canView = usePermission('VIEW_REPORT');
    const [search, setSearch] = useState('');

    const { data: res, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['eagle-eye'],
        queryFn: () => apiClient.get('/reports/eagle-eye'),
        enabled: canView,
        staleTime: 2 * 60 * 1000,
    });

    const sendMutation = useMutation({
        mutationFn: () => apiClient.post('/reports/send-now'),
        onSuccess: () => toast.success('📧 Daily report sent successfully!'),
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to send report'),
    });

    const report: EagleEyeReport | undefined = res?.data?.data;

    const downloadExcel = () => {
        if (!report) return;

        const data: any[] = [];
        // Add Header Row
        data.push(["NCP Eagle-Eye Report"]);
        data.push([`Generated at: ${format(new Date(report.generatedAt), 'dd MMM yyyy, hh:mm a')}`]);
        data.push([]); // Gap

        // Headers
        data.push(["Class", "Student Name", "Admission No.", "Net Fee", "Paid", "Outstanding", "Status"]);

        for (const group of report.byClass) {
            for (const s of group.students) {
                const status = s.outstanding <= 0 ? 'Cleared' : s.outstanding > s.netFee * 0.5 ? 'High Due' : 'Partial';
                data.push([
                    group.className,
                    s.name,
                    s.admissionNumber,
                    s.netFee,
                    s.paid,
                    s.outstanding,
                    status
                ]);
            }
        }

        // Add Summary
        data.push([]);
        data.push(["Institution Totals"]);
        data.push(["Total Enrolled", report.institution.totalEnrolled]);
        data.push(["Total Fees", report.institution.totalFees]);
        data.push(["Total Collected", report.institution.totalCollected]);
        data.push(["Total Outstanding", report.institution.totalOutstanding]);

        // Create Workbook
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Eagle-Eye");

        // Set column widths
        worksheet["!cols"] = [
            { wch: 25 }, // Class
            { wch: 25 }, // Name
            { wch: 15 }, // Adm. No
            { wch: 12 }, // Net Fee
            { wch: 12 }, // Paid
            { wch: 12 }, // Outstanding
            { wch: 15 }  // Status
        ];

        // Export
        XLSX.writeFile(workbook, `NCP_EagleEye_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handleDownloadPdf = async () => {
        try {
            await downloadElementAsPdf('eagle-eye-report', `NCP_EagleEye_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            toast.success('📄 PDF downloaded successfully');
        } catch (error) {
            toast.error('Failed to generate PDF');
        }
    };


    if (!canView) {
        return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>You do not have permission to view this report.</div>;
    }

    return (
        <div style={{ maxWidth: 1300 }}>
            <PageHeader
                title="Eagle-Eye Dashboard"
                subtitle="Complete session overview — all enrollments, class-wise breakdown, and outstanding dues."
            />

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap', background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="form-input"
                        placeholder="Search student or admission no..."
                        style={{ paddingLeft: 36, width: '100%', height: 40 }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                    <button className="btn-secondary" onClick={() => refetch()} disabled={isFetching} style={{ height: 40, padding: '0 16px' }}>
                        <Eye size={14} style={{ marginRight: 6 }} /> {isFetching ? '...' : 'Refresh'}
                    </button>

                    {/* Export Group */}
                    <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                        <button
                            className="btn-ghost"
                            onClick={handleDownloadPdf}
                            disabled={!report}
                            title="Download PDF"
                            style={{ height: 32, padding: '0 12px', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                            <Printer size={14} style={{ marginRight: 6 }} /> PDF
                        </button>
                        <div style={{ width: 1, background: 'var(--border)', margin: '4px 0' }} />
                        <button
                            className="btn-ghost"
                            onClick={downloadExcel}
                            disabled={!report}
                            title="Export Excel"
                            style={{ height: 32, padding: '0 12px', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                            <FileSpreadsheet size={14} style={{ marginRight: 6 }} /> Excel
                        </button>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={() => sendMutation.mutate()}
                        disabled={sendMutation.isPending}
                        style={{ height: 40, padding: '0 20px' }}
                    >
                        <Send size={14} style={{ marginRight: 6 }} /> {sendMutation.isPending ? 'Sending...' : 'Send Now'}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loading Eagle-Eye report...</div>
            ) : !report ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>No data available.</div>
            ) : (
                <div id="eagle-eye-report">
                    {/* Generated at */}
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                        Generated at {format(new Date(report.generatedAt), 'dd MMM yyyy, hh:mm a')}
                    </div>

                    {/* ── KPI Cards ── */}
                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                        <KpiCard
                            label="Total Enrolled"
                            value={report.institution.totalEnrolled}
                            color="linear-gradient(90deg,#6366f1,#4f46e5)"
                            sub="Active students this session"
                        />
                        <KpiCard
                            label="Total Fees (Net)"
                            value={report.institution.totalFees}
                            color="linear-gradient(90deg,#0284c7,#0369a1)"
                            isCurrency
                            sub="After all concessions"
                        />
                        <KpiCard
                            label="Total Collected"
                            value={report.institution.totalCollected}
                            color="linear-gradient(90deg,#059669,#047857)"
                            isCurrency
                            sub={`${pct(report.institution.totalCollected, report.institution.totalFees)}% of net fees`}
                        />
                        <KpiCard
                            label="Total Outstanding"
                            value={report.institution.totalOutstanding}
                            color="linear-gradient(90deg,#dc2626,#b91c1c)"
                            isCurrency
                            sub={`${pct(report.institution.totalOutstanding, report.institution.totalFees)}% of net fees pending`}
                        />
                    </div>

                    {/* ── Collection Progress ── */}
                    <div className="card" style={{ padding: '14px 20px', marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Overall Collection Progress
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#059669' }}>
                                {pct(report.institution.totalCollected, report.institution.totalFees)}%
                            </div>
                        </div>
                        <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                                width: `${pct(report.institution.totalCollected, report.institution.totalFees)}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg,#059669,#34d399)',
                                borderRadius: 99,
                                transition: 'width 0.6s ease',
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <span>Collected: {formatCurrency(report.institution.totalCollected)}</span>
                            <span>Remaining: {formatCurrency(report.institution.totalOutstanding)}</span>
                        </div>
                    </div>

                    {/* ── Two-column: At Risk + Class Summary ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        {/* At Risk */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertTriangle size={15} color="#dc2626" />
                                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>At-Risk Students</div>
                                <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Top 10 by Outstanding</div>
                            </div>
                            {report.atRisk.length === 0 ? (
                                <div style={{ padding: '30px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    🎉 No outstanding dues!
                                </div>
                            ) : (
                                <div>
                                    {report.atRisk.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{
                                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                                background: i < 3 ? 'rgba(220,38,38,0.1)' : 'var(--bg-subtle)',
                                                color: i < 3 ? '#dc2626' : 'var(--text-muted)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.68rem', fontWeight: 800,
                                            }}>
                                                {i + 1}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.83rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.admissionNumber} · {s.className}</div>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#dc2626', flexShrink: 0 }}>
                                                {formatCurrency(s.outstanding)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Class Summary Table */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TrendingUp size={15} color="#6366f1" />
                                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Class Summary</div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            {['Class', 'Students', 'Collected', '%'].map(h => (
                                                <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Class' ? 'left' : 'right', fontWeight: 700, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.byClass.map((g, i) => {
                                            const p = pct(g.collected, g.totalFees);
                                            return (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{g.className}</td>
                                                    <td style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>{g.enrolled}</td>
                                                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>{formatCurrency(g.collected)}</td>
                                                    <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: p >= 80 ? '#059669' : p >= 50 ? '#d97706' : '#dc2626' }}>{p}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── Class-wise Drill Down ── */}
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={15} color="var(--text-muted)" />
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Class-wise Student Details</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>— click to expand</span>
                    </div>
                    {report.byClass.map((group, i) => (
                        <ClassSection key={i} group={group} search={search} />
                    ))}
                </div>
            )}
        </div>
    );
}
