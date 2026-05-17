import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Receipt, Download,   
     Filter, RefreshCw, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import apiClient from '../../api/client';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import { useDebounce } from '../../hooks/useDebounce';

interface ExtendedTransaction {
    _id: string;
    enrollmentId: string;
    studentId: string;
    studentName: string;
    studentAdmissionNumber: string;
    studentPhone: string;
    className: string;
    academicYear: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    referenceType: 'PAYMENT' | 'CONCESSION' | 'ADJUSTMENT' | 'CANCELLATION';
    referenceId: string;
    paymentMode: 'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'BANK_TRANSFER' | 'N/A';
    description: string;
    createdAt: string;
    createdBy: {
        _id: string;
        name: string;
        email: string;
    };
}

export function TransactionsPage() {
    const navigate = useNavigate();

    // Core Filter States
    const [search, setSearch] = useState('');
    const dSearch = useDebounce(search);
    const [type, setType] = useState<string>('');
    const [refType, setRefType] = useState<string>('');
    const [academicYear, setAcademicYear] = useState<string>('');
    const [receiver, setReceiver] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('');
    
    // Date Filters
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Pagination
    const [page, setPage] = useState(1);
    const limit = 50;

    // Export Loading State
    const [isExporting, setIsExporting] = useState(false);

    // Fetch system users for Authorized Receiver dropdown
    const { data: usersRes } = useQuery({
        queryKey: ['rbac-users'],
        queryFn: () => apiClient.get('/rbac/users'),
    });
    const usersList = (usersRes?.data?.data || []) as any[];

    // Build API query parameters for server pagination
    const queryParams: any = {
        limit,
        skip: (page - 1) * limit
    };
    if (dSearch) queryParams.search = dSearch;
    if (type) queryParams.type = type;
    if (refType) queryParams.referenceType = refType;
    if (academicYear) queryParams.academicYear = academicYear;
    if (receiver) queryParams.createdBy = receiver;
    if (paymentMode) queryParams.paymentMode = paymentMode;
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    // Fetch Transactions Query
    const { data: txRes, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['reports-transactions', queryParams],
        queryFn: () => apiClient.get('/reports/transactions', { params: queryParams }),
    });

    const paginatedTransactions = (txRes?.data?.data?.transactions || []) as ExtendedTransaction[];
    const totalCount = txRes?.data?.data?.total || 0;
    const stats = txRes?.data?.data?.stats || {
        totalCredits: 0,
        totalDebits: 0,
        totalConcessions: 0,
        totalCount: 0
    };

    // Reset pagination on filter change
    useEffect(() => {
        setPage(1);
    }, [search, type, refType, academicYear, receiver, paymentMode, startDate, endDate]);

    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;

    // Export to Excel Function (fetches complete filtered set in one go)
    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            // Fetch all entries with the same filters but without pagination slicing
            const exportParams = {
                ...queryParams,
                limit: 100000,
                skip: 0
            };

            const res = await apiClient.get('/reports/transactions', { params: exportParams });
            const allTxs = (res?.data?.data?.transactions || []) as ExtendedTransaction[];

            if (allTxs.length === 0) {
                alert('No transaction records found to export.');
                return;
            }

            // Excel CSV with UTF-8 BOM to force MS Excel to load Unicode columns without encoding corruption
            const headers = [
                'Transaction ID',
                'Date & Time',
                'Student Name',
                'Admission ID',
                'Class & Section',
                'Academic Year',
                'Transaction Type',
                'Category',
                'Payment Mode',
                'Amount (INR)',
                'Authorized Receiver',
                'Description'
            ];

            const rows = allTxs.map(t => [
                t._id,
                format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                `"${t.studentName.replace(/"/g, '""')}"`,
                t.studentAdmissionNumber,
                `"${t.className.replace(/"/g, '""')}"`,
                t.academicYear,
                t.type,
                t.referenceType,
                t.paymentMode,
                t.amount,
                `"${t.createdBy?.name?.replace(/"/g, '""') || 'System'}"`,
                `"${(t.description || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = '\u00EF\u00BB\u00BF' // UTF-8 BOM
                + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `Transactions_Register_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Export Error:', err);
            alert('Failed to export transaction register.');
        } finally {
            setIsExporting(false);
        }
    };

    // Quick Date Range helper
    const handleQuickDate = (range: 'today' | 'yesterday' | 'week' | 'month' | 'reset') => {
        const today = new Date();
        if (range === 'today') {
            const dateStr = format(today, 'yyyy-MM-dd');
            setStartDate(dateStr);
            setEndDate(dateStr);
        } else if (range === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const dateStr = format(yesterday, 'yyyy-MM-dd');
            setStartDate(dateStr);
            setEndDate(dateStr);
        } else if (range === 'week') {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            setStartDate(format(lastWeek, 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        } else if (range === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(format(firstDay, 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        } else {
            setStartDate('');
            setEndDate('');
        }
    };

    const resetFilters = () => {
        setSearch('');
        setType('');
        setRefType('');
        setAcademicYear('');
        setReceiver('');
        setPaymentMode('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    // Render numbered page links for pagination
    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={page === i ? 'btn-primary' : 'btn-secondary'}
                    style={{
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        minWidth: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 6,
                        ...(page === i ? {} : { background: 'var(--bg-surface)' })
                    }}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
            
            {/* ── Summary Stats Cards ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16
            }}>
                <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--success)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                        Total Collected (Credits)
                    </div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '-0.02em' }}>
                        {formatCurrency(stats.totalCredits)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Calculated across all matching results
                    </div>
                </div>

                <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--danger)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                        Total Reversed (Debits)
                    </div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--danger)', letterSpacing: '-0.02em' }}>
                        {formatCurrency(stats.totalDebits)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Cancellations and reversals
                    </div>
                </div>

                <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                        Total Concessions
                    </div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--warning)', letterSpacing: '-0.02em' }}>
                        {formatCurrency(stats.totalConcessions)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Waived concession values
                    </div>
                </div>

                <div className="card" style={{ padding: 20, borderLeft: '4px solid #6366f1' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                        Filtered Entries Count
                    </div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.02em' }}>
                        {stats.totalCount}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        In current date range & filters
                    </div>
                </div>
            </div>

            {/* ── Detailed Search & Filters Panel ── */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Filter size={18} color="#6366f1" /> Advanced Transaction Filters
                    </h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => refetch()}
                            disabled={isLoading || isFetching}
                        >
                            <RefreshCw size={12} className={isFetching ? 'spin' : ''} /> Refresh
                        </button>
                        <button 
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={resetFilters}
                        >
                            <X size={12} /> Clear Filters
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                    {/* Student Search */}
                    <div>
                        <label className="form-label">Search Student</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="form-input" 
                                placeholder="Student name or ID..."
                                style={{ paddingLeft: 30 }}
                            />
                        </div>
                    </div>

                    {/* Transaction Type */}
                    <div>
                        <label className="form-label">Transaction Type</label>
                        <select 
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="form-select"
                        >
                            <option value="">All Types</option>
                            <option value="CREDIT">CREDIT (Collections)</option>
                            <option value="DEBIT">DEBIT (Cancellations/Charges)</option>
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="form-label">Category</label>
                        <select 
                            value={refType}
                            onChange={e => setRefType(e.target.value)}
                            className="form-select"
                        >
                            <option value="">All Categories</option>
                            <option value="PAYMENT">PAYMENT</option>
                            <option value="CONCESSION">CONCESSION</option>
                            <option value="CANCELLATION">CANCELLATION</option>
                            <option value="ADJUSTMENT">ADJUSTMENT</option>
                        </select>
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="form-label">Payment Mode</label>
                        <select 
                            value={paymentMode}
                            onChange={e => setPaymentMode(e.target.value)}
                            className="form-select"
                        >
                            <option value="">All Modes</option>
                            <option value="CASH">CASH</option>
                            <option value="UPI">UPI</option>
                            <option value="CARD">CARD</option>
                            <option value="CHEQUE">CHEQUE</option>
                            <option value="BANK_TRANSFER">BANK TRANSFER</option>
                        </select>
                    </div>

                    {/* Receiver */}
                    <div>
                        <label className="form-label">Authorized Receiver</label>
                        <select 
                            value={receiver}
                            onChange={e => setReceiver(e.target.value)}
                            className="form-select"
                        >
                            <option value="">All Receivers</option>
                            {usersList.map((u: any) => (
                                <option key={u.id || u._id} value={u.id || u._id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Academic Year */}
                    <div>
                        <label className="form-label">Academic Year</label>
                        <select 
                            value={academicYear}
                            onChange={e => setAcademicYear(e.target.value)}
                            className="form-select"
                        >
                            <option value="">All Years</option>
                            <option value="2026-27">2026-27</option>
                            <option value="2025-26">2025-26</option>
                            <option value="2024-25">2024-25</option>
                        </select>
                    </div>

                    {/* Date Picker Controls */}
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Date Range Filter
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={e => setStartDate(e.target.value)} 
                                    className="form-input" 
                                    style={{ width: 140 }} 
                                />
                                <span style={{ color: 'var(--text-muted)' }}>to</span>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={e => setEndDate(e.target.value)} 
                                    className="form-input" 
                                    style={{ width: 140 }} 
                                />
                            </div>

                            {/* Quick Select Buttons */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem', borderRadius: 6 }} onClick={() => handleQuickDate('today')}>Today</button>
                                <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem', borderRadius: 6 }} onClick={() => handleQuickDate('yesterday')}>Yesterday</button>
                                <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem', borderRadius: 6 }} onClick={() => handleQuickDate('week')}>Last 7 Days</button>
                                <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem', borderRadius: 6 }} onClick={() => handleQuickDate('month')}>This Month</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table / Grid Section ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h3 style={{ fontSize: '1.06rem', fontWeight: 800 }}>Ledger Transactions Log</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Showing {startIndex + 1} - {Math.min(startIndex + limit, totalCount)} of {totalCount} total entries
                        </p>
                    </div>
                    {totalCount > 0 && (
                        <button 
                            className="btn-primary" 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 8,
                                background: '#107c41', // Classic Microsoft Excel Green
                                borderColor: '#107c41' 
                            }}
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            onMouseEnter={e => e.currentTarget.style.background = '#0e6c38'}
                            onMouseLeave={e => e.currentTarget.style.background = '#107c41'}
                        >
                            <Download size={14} /> {isExporting ? 'Exporting...' : 'Export Excel'}
                        </button>
                    )}
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Student Details</th>
                                <th>Class & Year</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Mode</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th>Receiver</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '60px 0' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                            <div className="spin" style={{ width: 30, height: 30, border: '3px solid var(--border)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading financial transaction log...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                                        <Receipt size={40} style={{ opacity: 0.4, marginBottom: 8 }} />
                                        <div style={{ fontWeight: 600 }}>No transactions found</div>
                                        <div style={{ fontSize: '0.78rem', marginTop: 4 }}>Try clearing or widening your query filters.</div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTransactions.map((tx) => {
                                    const isCredit = tx.type === 'CREDIT';
                                    return (
                                        <tr key={tx._id} style={{ transition: 'background 0.2s' }}>
                                            {/* Date & Time */}
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                                    {format(new Date(tx.createdAt), 'dd MMM yyyy')}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    {format(new Date(tx.createdAt), 'hh:mm a')}
                                                </div>
                                            </td>

                                            {/* Student Details */}
                                            <td>
                                                <button
                                                    onClick={() => navigate(`/ledger?studentId=${tx.studentId}&enrollmentId=${tx.enrollmentId}`)}
                                                    style={{
                                                        border: 'none', background: 'transparent', padding: 0, margin: 0, textAlign: 'left',
                                                        cursor: 'pointer', display: 'flex', flexDirection: 'column'
                                                    }}
                                                    title="Click to view full student ledger"
                                                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                                >
                                                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>
                                                        {tx.studentName}
                                                    </span>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                                        ADM ID: <strong>{tx.studentAdmissionNumber}</strong>
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Class & Academic Year */}
                                            <td>
                                                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                                                    {tx.className}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    Session: {tx.academicYear}
                                                </div>
                                            </td>

                                            {/* Type Badge */}
                                            <td>
                                                <span style={{
                                                    fontSize: '0.66rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                                                    background: isCredit ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                                    color: isCredit ? '#10b981' : '#ef4444',
                                                    border: `1px solid ${isCredit ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`
                                                }}>
                                                    {tx.type}
                                                </span>
                                            </td>

                                            {/* Category Badge */}
                                            <td>
                                                <span style={{
                                                    fontSize: '0.66rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                                                    background: tx.referenceType === 'PAYMENT' ? 'rgba(99,102,241,0.08)' :
                                                                tx.referenceType === 'CONCESSION' ? 'rgba(245,158,11,0.08)' :
                                                                tx.referenceType === 'CANCELLATION' ? 'rgba(239,68,68,0.08)' : 'rgba(107,114,128,0.08)',
                                                    color: tx.referenceType === 'PAYMENT' ? '#6366f1' :
                                                            tx.referenceType === 'CONCESSION' ? '#f59e0b' :
                                                            tx.referenceType === 'CANCELLATION' ? '#ef4444' : '#6b7280',
                                                    border: `1px solid ${
                                                                tx.referenceType === 'PAYMENT' ? 'rgba(99,102,241,0.15)' :
                                                                tx.referenceType === 'CONCESSION' ? 'rgba(245,158,11,0.15)' :
                                                                tx.referenceType === 'CANCELLATION' ? 'rgba(239,68,68,0.15)' : 'rgba(107,114,128,0.15)'
                                                            }`
                                                }}>
                                                    {tx.referenceType}
                                                </span>
                                            </td>

                                            {/* Payment Mode Badge */}
                                            <td>
                                                <span style={{
                                                    fontSize: '0.66rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                                                    background: tx.paymentMode === 'CASH' ? 'rgba(16,185,129,0.08)' :
                                                                tx.paymentMode === 'UPI' ? 'rgba(99,102,241,0.08)' :
                                                                tx.paymentMode === 'CARD' ? 'rgba(236,72,153,0.08)' :
                                                                tx.paymentMode === 'BANK_TRANSFER' ? 'rgba(59,130,246,0.08)' :
                                                                tx.paymentMode === 'CHEQUE' ? 'rgba(245,158,11,0.08)' : 'transparent',
                                                    color: tx.paymentMode === 'CASH' ? '#10b981' :
                                                            tx.paymentMode === 'UPI' ? '#6366f1' :
                                                            tx.paymentMode === 'CARD' ? '#ec4899' :
                                                            tx.paymentMode === 'BANK_TRANSFER' ? '#3b82f6' :
                                                            tx.paymentMode === 'CHEQUE' ? '#f59e0b' : 'var(--text-muted)',
                                                    border: `1px solid ${
                                                                tx.paymentMode === 'CASH' ? 'rgba(16,185,129,0.15)' :
                                                                tx.paymentMode === 'UPI' ? 'rgba(99,102,241,0.15)' :
                                                                tx.paymentMode === 'CARD' ? 'rgba(236,72,153,0.15)' :
                                                                tx.paymentMode === 'BANK_TRANSFER' ? 'rgba(59,130,246,0.15)' :
                                                                tx.paymentMode === 'CHEQUE' ? 'rgba(245,158,11,0.15)' : 'transparent'
                                                            }`
                                                }}>
                                                    {tx.paymentMode}
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontWeight: 800,
                                                    fontSize: '0.9rem',
                                                    color: isCredit ? '#10b981' : '#ef4444'
                                                }}>
                                                    {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </div>
                                            </td>

                                            {/* Receiver Name */}
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{
                                                        width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,102,241,0.1)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.625rem', color: '#6366f1', fontWeight: 800
                                                    }}>
                                                        {(tx.createdBy?.name || 'A').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                        {tx.createdBy?.name || 'System'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Description details */}
                                            <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                <span style={{ fontSize: '0.78rem' }}>{tx.description || 'No description recorded'}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Table Pagination Footer ── */}
                {totalCount > 0 && (
                    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            Showing <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + limit, totalCount)}</strong> of <strong>{totalCount}</strong> transactions
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button 
                                className="btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, height: 32 }}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            
                            <div style={{ display: 'flex', gap: 4 }}>
                                {renderPageNumbers()}
                            </div>

                            <button 
                                className="btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, height: 32 }}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Spinning styling animation keyframes wrapper */}
            <style>{`
                .spin {
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
