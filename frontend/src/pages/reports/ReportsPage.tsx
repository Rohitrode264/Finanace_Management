import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Search, Mail, Send, ToggleLeft, ToggleRight, Printer, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import { reportService } from '../../api/services/report.service';
import { enrollmentService } from '../../api/services/enrollment.service';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';
import { useDebounce } from '../../hooks/useDebounce';
import { studentsService } from '../../api/services/students.service';
import apiClient from '../../api/client';
import { TruncatedText } from '../../components/ui/TruncatedText';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import { downloadElementAsPdf } from '../../utils/reportPdf';

// ── Custom calendar CSS injected globally once ──────────────────────────────
const calendarStyles = `
.rdp-custom .react-datepicker {
    font-family: 'Segoe UI', system-ui, sans-serif;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.10);
    background: var(--bg-surface, #fff);
    overflow: hidden;
    min-width: 280px;
}
.rdp-custom .react-datepicker__header {
    background: var(--bg-subtle, #f8fafc);
    border-bottom: 1px solid var(--border, #e2e8f0);
    padding: 14px 14px 10px;
    border-radius: 0;
}
.rdp-custom .react-datepicker__current-month {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary, #1e293b);
    margin-bottom: 8px;
}
.rdp-custom .react-datepicker__day-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted, #94a3b8);
    width: 36px;
    line-height: 2;
}
.rdp-custom .react-datepicker__day {
    width: 36px;
    height: 36px;
    line-height: 36px;
    border-radius: 8px;
    font-size: 13px;
    color: var(--text-primary, #1e293b);
    transition: background 0.15s, color 0.15s;
    margin: 1px;
}
.rdp-custom .react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
    background: rgba(99,102,241,0.12) !important;
    border-radius: 8px;
}
.rdp-custom .react-datepicker__day--selected,
.rdp-custom .react-datepicker__day--range-start,
.rdp-custom .react-datepicker__day--range-end {
    background: #6366f1 !important;
    color: #fff !important;
    border-radius: 8px;
    font-weight: 700;
}
.rdp-custom .react-datepicker__day--in-range {
    background: rgba(99,102,241,0.12) !important;
    border-radius: 0;
    color: #4f46e5;
}
.rdp-custom .react-datepicker__day--in-selecting-range {
    background: rgba(99,102,241,0.08) !important;
}
.rdp-custom .react-datepicker__day--keyboard-selected {
    background: rgba(99,102,241,0.15) !important;
    color: #4338ca;
}
.rdp-custom .react-datepicker__day--disabled {
    color: var(--text-muted, #cbd5e1);
    cursor: not-allowed;
}
.rdp-custom .react-datepicker__day--highlighted-payment {
    background: rgba(16,185,129,0.13);
    color: #059669;
    font-weight: 700;
    border-radius: 8px;
    position: relative;
}
.rdp-custom .react-datepicker__day--highlighted-payment::after {
    content: '';
    position: absolute;
    bottom: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #10b981;
}
.rdp-custom .react-datepicker__navigation--previous,
.rdp-custom .react-datepicker__navigation--next {
    top: 14px;
}
.rdp-custom .react-datepicker__navigation-icon::before {
    border-color: #6366f1;
}
.rdp-custom .react-datepicker__month {
    padding: 8px;
    margin: 0;
}
`;

function injectCalendarStyles() {
    if (!document.getElementById('rdp-custom-styles')) {
        const style = document.createElement('style');
        style.id = 'rdp-custom-styles';
        style.textContent = calendarStyles;
        document.head.appendChild(style);
    }
}
// Inject once on module load
injectCalendarStyles();

export function ReportsPage() {
    const [activeTab, setActiveTab] = useState<'daily' | 'ledger'>('daily');
    const today = new Date();

    // Date range state (for datepicker)
    const [startDate, setStartDate] = useState<Date>(today);
    const [endDate, setEndDate] = useState<Date | null>(today);

    // Which month/year is visible in the calendar (for fetching payment dates)
    const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>({
        year: today.getFullYear(),
        month: today.getMonth() + 1,
    });

    const [lookupId, setLookupId] = useState('');
    const [autoSendEnabled, setAutoSendEnabled] = useState<boolean | null>(null);

    // Ledger student search state
    const [ledgerSearch, setLedgerSearch] = useState('');
    const dLedgerSearch = useDebounce(ledgerSearch, 400);

    const canViewReport = usePermission('VIEW_REPORT');

    const { data: ledgerStudentsRes } = useQuery({
        queryKey: ['report-ledger-student-search', dLedgerSearch],
        queryFn: () => studentsService.list({ search: dLedgerSearch, limit: 5 }),
        enabled: dLedgerSearch.length >= 2,
    });
    const ledgerStudents: any[] = (ledgerStudentsRes?.data?.data as { students: any[] })?.students ?? [];

    // Fetch payment dates for calendar highlighting
    const { data: paymentDatesRes } = useQuery({
        queryKey: ['payment-dates', calendarMonth.year, calendarMonth.month],
        queryFn: () => apiClient.get(`/reports/payment-dates?year=${calendarMonth.year}&month=${calendarMonth.month}`),
        enabled: canViewReport,
        staleTime: 5 * 60 * 1000,
    });
    const paymentDateStrings: string[] = (paymentDatesRes?.data?.data?.dates as string[]) ?? [];
    const highlightedDates = paymentDateStrings.map(d => new Date(d + 'T00:00:00'));

    const selectedDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : selectedDateStr;

    const { data: dailyRes, isLoading: dLoading } = useQuery({
        queryKey: ['report-daily', selectedDateStr, endDateStr],
        queryFn: () => reportService.daily(
            selectedDateStr,
            endDateStr !== selectedDateStr ? endDateStr : undefined
        ),
        enabled: activeTab === 'daily' && canViewReport,
    });

    const { data: ledgerRes, isLoading: lLoading } = useQuery({
        queryKey: ['report-ledger', lookupId],
        queryFn: () => enrollmentService.getLedger(lookupId),
        enabled: !!lookupId && activeTab === 'ledger',
    });

    // Auto-send setting
    useQuery({
        queryKey: ['setting', 'DAILY_REPORT_AUTO_SEND'],
        queryFn: () => apiClient.get('/settings/DAILY_REPORT_AUTO_SEND'),
        onSuccess: (res: any) => {
            const val = res?.data?.data?.value;
            setAutoSendEnabled(val === 'true' || val === true);
        },
    } as any);

    const toggleAutoSend = useMutation({
        mutationFn: (val: boolean) =>
            apiClient.post('/settings', { key: 'DAILY_REPORT_AUTO_SEND', value: String(val) }),
        onSuccess: (_: any, val: boolean) => {
            setAutoSendEnabled(val);
            toast.success(`Scheduled report ${val ? 'enabled' : 'disabled'}`);
        },
        onError: () => toast.error('Failed to update setting'),
    });

    const sendNowMutation = useMutation({
        mutationFn: () => apiClient.post('/reports/send-now'),
        onSuccess: () => toast.success('📧 Daily report sent successfully!'),
        onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to send report'),
    });

    const daily = dailyRes?.data?.data;
    const ledger = (ledgerRes?.data?.data as any);

    const tabStyle = (active: boolean) => ({
        padding: '8px 18px', border: 'none', cursor: 'pointer',
        background: active ? '#6366f1' : 'var(--bg-subtle)',
        color: active ? '#fff' : 'var(--text-secondary)',
        borderRadius: 8, fontSize: '0.875rem', fontWeight: 600 as const, transition: 'all 0.2s',
    });

    const downloadExcel = () => {
        if (!daily) return;

        const data: any[] = [];
        // Header
        data.push(["NCP Daily Collection Report"]);
        data.push([`Period: ${daily.date}`]);
        data.push([]);

        // New Admissions
        if (daily.newAdmissions?.students?.length > 0) {
            data.push(["New Admissions Today"]);
            data.push(["Name", "Adm. No.", "Deposited", "Total Paid", "Balance", "Collected By"]);
            daily.newAdmissions.students.forEach((s: any) => {
                data.push([s.name, s.admissionNumber, s.deposited, s.totalPaid, s.left, s.collectedBy]);
            });
            data.push([]);
        }

        // Installment Payments
        if (daily.existingStudentsActivity?.length > 0) {
            data.push(["Installment Payments"]);
            data.push(["Name", "Adm. No.", "Paid Today", "Total Paid", "Balance", "Collected By"]);
            daily.existingStudentsActivity.forEach((s: any) => {
                data.push([s.name, s.admissionNumber, s.deposited, s.totalPaid, s.left, s.collectedBy]);
            });
            data.push([]);
        }

        // Summary
        data.push(["Financial Summary"]);
        data.push(["Total Collected", daily.totalCollected]);
        data.push(["Net Receipts", daily.netReceipts]);
        data.push(["Concessions", daily.totalConcessions]);
        data.push(["Cancellations", daily.totalCancellations]);
        data.push(["CP Share (35%)", daily.ncpShare]);

        // Create Workbook
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Report");

        // Column widths
        worksheet["!cols"] = [
            { wch: 25 }, // Name
            { wch: 15 }, // Adm No
            { wch: 12 }, // Deposited/Paid
            { wch: 12 }, // Total Paid
            { wch: 12 }, // Balance
            { wch: 20 }  // Collected By
        ];

        // Export
        XLSX.writeFile(workbook, `NCP_DailyReport_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handleDownloadPdf = async () => {
        try {
            await downloadElementAsPdf('daily-report-content', `NCP_DailyReport_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            toast.success('📄 PDF downloaded successfully');
        } catch (error) {
            toast.error('Failed to generate PDF');
        }
    };

    const onCalendarMonthChange = useCallback((date: Date) => {
        setCalendarMonth({ year: date.getFullYear(), month: date.getMonth() + 1 });
    }, []);

    const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        if (start) setStartDate(start);
        setEndDate(end);
    };

    return (
        <div>
            <PageHeader
                title="Financial Reports"
                subtitle="View daily collection summaries and enrollment-level ledger details."
            />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button style={tabStyle(activeTab === 'daily')} onClick={() => setActiveTab('daily')}>
                    <Calendar size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Daily Collection
                </button>
                <button style={tabStyle(activeTab === 'ledger')} onClick={() => setActiveTab('ledger')}>
                    <BarChart3 size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Enrollment Ledger
                </button>
            </div>

            {/* Daily Report */}
            {activeTab === 'daily' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} id="daily-report-content">
                    {/* Date Picker + CSV Row */}
                    <div className="card" style={{ padding: 20, marginBottom: 20, display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div className="rdp-custom" style={{ flex: '1 1 260px' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={14} color="#6366f1" /> Select Date Range
                            </div>
                            <DatePicker
                                selected={startDate}
                                onChange={handleDateRangeChange}
                                startDate={startDate}
                                endDate={endDate}
                                selectsRange
                                inline
                                maxDate={today}
                                onMonthChange={onCalendarMonthChange}
                                highlightDates={[
                                    { 'react-datepicker__day--highlighted-payment': highlightedDates }
                                ]}
                                calendarClassName="rdp-inline-calendar"
                            />
                            <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                Green dots = days with payments
                            </div>
                        </div>

                        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'flex-start', paddingTop: 24 }}>
                            <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.06)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Selected Range</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#4f46e5', marginTop: 4 }}>
                                    {format(startDate, 'dd MMM yyyy')}
                                    {endDate && endDate.toDateString() !== startDate.toDateString() && ` → ${format(endDate, 'dd MMM yyyy')}`}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {/* Export Group */}
                                <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                                    <button
                                        className="btn-ghost"
                                        onClick={handleDownloadPdf}
                                        disabled={!daily || dLoading}
                                        title="Download PDF"
                                        style={{ height: 36, flex: 1, fontSize: '0.75rem', fontWeight: 700 }}
                                    >
                                        <Printer size={14} style={{ marginRight: 6 }} /> PDF
                                    </button>
                                    <div style={{ width: 1, background: 'var(--border)', margin: '4px 0' }} />
                                    <button
                                        className="btn-ghost"
                                        onClick={downloadExcel}
                                        disabled={!daily || dLoading}
                                        title="Export Excel"
                                        style={{ height: 36, flex: 1, fontSize: '0.75rem', fontWeight: 700 }}
                                    >
                                        <FileSpreadsheet size={14} style={{ marginRight: 6 }} /> Excel
                                    </button>
                                </div>
                            </div>

                            {/* Report Dispatch Card */}
                            <div style={{ padding: '14px 16px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border)', marginTop: 4 }}>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Mail size={14} color="#6366f1" /> Report Dispatch
                                </div>

                                {/* Auto-send toggle */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <div>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Auto-send at 7 PM</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Daily cron at 19:00</div>
                                    </div>
                                    <button
                                        onClick={() => toggleAutoSend.mutate(!autoSendEnabled)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        title={autoSendEnabled ? 'Disable auto-send' : 'Enable auto-send'}
                                    >
                                        {autoSendEnabled
                                            ? <ToggleRight size={28} color="#6366f1" />
                                            : <ToggleLeft size={28} color="#94a3b8" />}
                                    </button>
                                </div>

                                {/* Send Now */}
                                <button
                                    onClick={() => sendNowMutation.mutate()}
                                    disabled={sendNowMutation.isPending}
                                    style={{
                                        width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none',
                                        background: sendNowMutation.isPending ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.1)',
                                        color: '#059669', fontWeight: 700, fontSize: '0.8125rem',
                                        cursor: sendNowMutation.isPending ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <Send size={13} />
                                    {sendNowMutation.isPending ? 'Sending...' : 'Send Now'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {dLoading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading report...</div>
                    ) : !canViewReport ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>You do not have permission to view reports.</div>
                    ) : daily ? (
                        <>
                            <div className="stats-grid" style={{ marginBottom: 20 }}>
                                {[
                                    { label: 'Total Collected', value: daily.totalCollected, color: '#10b981', bar: 'linear-gradient(90deg,#10b981,#059669)' },
                                    { label: 'Net Receipts', value: daily.netReceipts, color: '#6366f1', bar: 'linear-gradient(90deg,#6366f1,#4f46e5)' },
                                    { label: 'Concessions', value: daily.totalConcessions, color: '#f59e0b', bar: 'linear-gradient(90deg,#f59e0b,#d97706)' },
                                    { label: 'Cancellations', value: daily.totalCancellations, color: '#ef4444', bar: 'linear-gradient(90deg,#ef4444,#dc2626)' },
                                ].map(c => (
                                    <div key={c.label} className="stat-card">
                                        <div className="stat-card-bar" style={{ background: c.bar }} />
                                        <div style={{ padding: '16px 20px' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color, marginTop: 4 }}>{formatCurrency(c.value)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* New Admissions */}
                            {daily.newAdmissions?.students?.length > 0 && (
                                <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                                    <h4 style={{ fontWeight: 700, marginBottom: 12, color: '#6366f1' }}>
                                        🎓 New Admissions Today ({daily.newAdmissions.total})
                                    </h4>
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Student Name</th>
                                                    <th>Adm. No.</th>
                                                    <th style={{ textAlign: 'right' }}>Deposited</th>
                                                    <th style={{ textAlign: 'right' }}>Total Paid</th>
                                                    <th style={{ textAlign: 'right' }}>Balance</th>
                                                    <th>Collected By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {daily.newAdmissions.students.map((s: any, i: number) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 600 }}>
                                                            <TruncatedText text={s.name} maxWidth="150px" modalTitle="Student Name" />
                                                        </td>
                                                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.admissionNumber}</td>
                                                        <td className="financial-value" style={{ color: '#10b981' }}>{formatCurrency(s.deposited)}</td>
                                                        <td className="financial-value">{formatCurrency(s.totalPaid)}</td>
                                                        <td className="financial-value" style={{ color: s.left > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(s.left)}</td>
                                                        <td style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6366f1' }}>{s.collectedBy}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Existing Students */}
                            {daily.existingStudentsActivity?.length > 0 && (
                                <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                                    <h4 style={{ fontWeight: 700, marginBottom: 12, color: '#6366f1' }}>
                                        📋 Installment Payments ({daily.existingStudentsActivity.length})
                                    </h4>
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Student Name</th>
                                                    <th>Adm. No.</th>
                                                    <th style={{ textAlign: 'right' }}>Paid Today</th>
                                                    <th style={{ textAlign: 'right' }}>Total Paid</th>
                                                    <th style={{ textAlign: 'right' }}>Balance</th>
                                                    <th>Collected By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {daily.existingStudentsActivity.map((s: any, i: number) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 600 }}>
                                                            <TruncatedText text={s.name} maxWidth="150px" modalTitle="Student Name" />
                                                        </td>
                                                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.admissionNumber}</td>
                                                        <td className="financial-value" style={{ color: '#10b981' }}>{formatCurrency(s.deposited)}</td>
                                                        <td className="financial-value">{formatCurrency(s.totalPaid)}</td>
                                                        <td className="financial-value" style={{ color: s.left > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(s.left)}</td>
                                                        <td style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6366f1' }}>{s.collectedBy}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Summary + CP Share */}
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Report Period</div>
                                        <div style={{ fontWeight: 700 }}>{daily.date}</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>Total Entries: {daily.entryCount}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overall Paid (Ongoing)</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#10b981' }}>{formatCurrency(daily.overallFinances?.paid ?? 0)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Outstanding</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ef4444' }}>{formatCurrency(daily.overallFinances?.left ?? 0)}</div>
                                        </div>
                                        {/* CP Share Highlight */}
                                        <div style={{
                                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                            padding: '14px 22px', borderRadius: 12, color: '#fff',
                                            boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                                        }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                CP Share (35%)
                                            </div>
                                            <div style={{ fontWeight: 900, fontSize: '1.375rem', marginTop: 4 }}>
                                                {formatCurrency(daily.ncpShare)}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.75, marginTop: 2 }}>
                                                of ₹{daily.netReceipts?.toLocaleString('en-IN')} net receipts
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data for selected date range.</div>
                    )}
                </motion.div>
            )}

            {/* Enrollment Ledger */}
            {activeTab === 'ledger' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Lookup Enrollment Ledger</h3>
                        <div style={{ position: 'relative', maxWidth: 400 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                value={ledgerSearch}
                                onChange={e => setLedgerSearch(e.target.value)}
                                className="form-input"
                                placeholder="Search by student name or admission ID..."
                                style={{ paddingLeft: 36, width: '100%' }}
                            />
                            {dLedgerSearch.length >= 2 && ledgerStudents.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                    {ledgerStudents.map((s: any) => (
                                        <button
                                            key={s._id}
                                            style={{ width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}
                                            onClick={() => {
                                                apiClient.get(`/enrollments/student/${s._id}`).then((res: any) => {
                                                    const enrs = res.data?.data;
                                                    if (enrs && enrs.length > 0) {
                                                        const activeEnr = enrs.find((e: any) => e.status === 'ONGOING') || enrs[0];
                                                        setLookupId(activeEnr._id);
                                                        setLedgerSearch(`${s.firstName} ${s.lastName} - ${activeEnr.academicYear}`);
                                                    } else {
                                                        toast.error('No enrollments found for student');
                                                    }
                                                });
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.admissionNumber} · {s.phone}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {lLoading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading ledger...</div>
                    ) : ledger ? (
                        <>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                <div className="stat-card" style={{ flex: 1 }}>
                                    <div className="stat-card-bar" style={{ background: 'linear-gradient(90deg,#6366f1,#4f46e5)' }} />
                                    <div style={{ padding: '14px 18px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Outstanding Balance</div>
                                        <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#ef4444', marginTop: 4 }}>{formatCurrency(ledger.outstandingBalance ?? 0)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Reference</th>
                                            <th>Description</th>
                                            <th style={{ textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledger.ledger?.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                                    No ledger entries found.
                                                </td>
                                            </tr>
                                        ) : (
                                            ledger.ledger?.map((entry: any) => (
                                                <tr key={entry._id}>
                                                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                        {format(new Date(entry.createdAt), 'dd MMM yyyy hh:mm a')}
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700,
                                                            background: entry.type === 'CREDIT' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                            color: entry.type === 'CREDIT' ? '#10b981' : '#ef4444',
                                                        }}>
                                                            {entry.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.8125rem' }}>{entry.referenceType}</td>
                                                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                        <TruncatedText text={entry.description} maxWidth="160px" modalTitle="Transaction Description" />
                                                    </td>
                                                    <td className="financial-value" style={{ color: entry.type === 'CREDIT' ? '#10b981' : '#ef4444' }}>
                                                        {entry.type === 'CREDIT' ? '+' : '-'}{formatCurrency(entry.amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : lookupId ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No ledger found. Check the enrollment ID.</div>
                    ) : null}
                </motion.div>
            )}
        </div>
    );
}
