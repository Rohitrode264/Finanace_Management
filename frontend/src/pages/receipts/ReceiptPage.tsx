import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { receiptService } from '../../api/services/receipt.service';
import { ProfessionalReceipt } from '../../components/receipts/ProfessionalReceipt';

export function ReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['receipt', id],
        queryFn: () => receiptService.getById(id!),
        enabled: !!id,
    });

    const receipt = data?.data?.data;
    const payment = receipt?.paymentId && typeof receipt.paymentId === 'object' ? receipt.paymentId as any : null;

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading receipt...</div>
            </div>
        );
    }

    if (!receipt) {
        return (
            <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'var(--text-muted)' }}>Receipt not found.</p>
                <button className="btn-secondary" onClick={() => navigate('/payments')} style={{ marginTop: 16 }}>
                    <ArrowLeft size={14} /> Go Back
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Screen-only header — hidden during print via global print rule in ProfessionalReceipt */}
            <style>{`
                @media print {
                    .receipt-screen-header { display: none !important; }
                }
            `}</style>

            <div style={{ maxWidth: 820, margin: '0 auto' }}>
                {/* Screen-only controls */}
                <div className="receipt-screen-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <button className="btn-secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}>
                        <ArrowLeft size={14} />
                    </button>
                    <div>
                        <h2 className="page-title">Receipt #{receipt.receiptNumber}</h2>
                        <p className="page-subtitle">Official payment receipt from New Career Point</p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => window.print()}
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <Printer size={15} /> Print Receipt
                    </button>
                </div>

                {/* Receipt area — this is the print target */}
                <div
                    className="ncp-receipt-print-wrapper card"
                    style={{ overflow: 'hidden', padding: '28px 32px', background: '#fff' }}
                    id="receipt-print-area"
                >
                    <ProfessionalReceipt
                        receipt={receipt}
                        payment={payment}
                        enrollment={receipt.enrollmentId as any}
                        student={payment.enrollmentId?.studentId || (receipt.enrollmentId as any)?.studentId}
                        academicClass={(receipt.enrollmentId as any)?.academicClassId}
                    />
                </div>
            </div>
        </>
    );
}
