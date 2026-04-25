import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { useSilentPrint } from '../../hooks/useSilentPrint';
import { receiptService } from '../../api/services/receipt.service';
import { ProfessionalReceipt } from '../../components/receipts/ProfessionalReceipt';

export function ReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const receiptRef = useRef<HTMLDivElement>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['receipt', id],
        queryFn: () => receiptService.getById(id!),
        enabled: !!id,
    });

    const { handlePrint, isPrinting } = useSilentPrint({
        contentRef: receiptRef,
        docType: 'receipt'
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
            <div style={{ maxWidth: 820, margin: '0 auto' }}>
                {/* Screen-only controls */}
                <div className="receipt-screen-header no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <button className="btn-secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}>
                        <ArrowLeft size={14} />
                    </button>
                    <div>
                        <h2 className="page-title">Receipt #{receipt.receiptNumber}</h2>
                        <p className="page-subtitle">Official payment receipt from New Career Point</p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handlePrint}
                        disabled={isPrinting}
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <Printer size={15} /> {isPrinting ? 'Printing...' : 'Print Receipt'}
                    </button>
                </div>

                {/* Receipt area — this is the print target */}
                <div
                    className="card"
                    style={{ padding: '28px 32px', background: '#fff', overflow: 'visible' }}
                    ref={receiptRef}
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
