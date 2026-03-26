import { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, XCircle, RefreshCw, Smartphone } from 'lucide-react';
import { mantraService } from '../../api/services/mantra.service';
import type { RDServiceInfo, CaptureResponse } from '../../api/services/mantra.service';
import toast from 'react-hot-toast';

interface BiometricScannerProps {
  onCapture: (pidData: string) => void;
  label?: string;
}

export function BiometricScanner({ onCapture, label = 'Biometric Verification' }: BiometricScannerProps) {
  const [deviceStatus, setDeviceStatus] = useState<RDServiceInfo | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapture, setLastCapture] = useState<CaptureResponse | null>(null);

  useEffect(() => {
    checkDevice();
  }, []);

  const checkDevice = async () => {
    const status = await mantraService.getDeviceInfo();
    setDeviceStatus(status);
    if (status.status === 'READY') {
      toast.success('Mantra MFS100 ready');
    } else if (status.status === 'NOTREADY') {
      toast.error('Device connected but RD Service not ready');
    } else {
      toast.error('Mantra device not found');
    }
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    setLastCapture(null);
    try {
      const result = await mantraService.captureFingerprint();
      setLastCapture(result);
      if (result.success && result.pidData) {
        toast.success('Fingerprint captured successfully');
        onCapture(result.pidData);
      } else {
        toast.error(`Capture failed: ${result.errorInfo}`);
      }
    } catch (error) {
      toast.error('An error occurred during capture');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="card" style={{ padding: '24px', maxWidth: '400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            background: 'var(--bg-subtle)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--sidebar-active)'
          }}>
            <Fingerprint size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{label}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              {deviceStatus?.status === 'READY' ? (
                <span className="badge badge-green">
                  <CheckCircle2 size={10} /> Online
                </span>
              ) : (
                <span className="badge badge-red">
                  <XCircle size={10} /> {deviceStatus?.status || 'Offline'}
                </span>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={checkDevice} 
          className="btn-secondary" 
          style={{ padding: '8px', borderRadius: '8px' }}
          title="Refresh Device Status"
        >
          <RefreshCw size={14} className={deviceStatus === null ? 'animate-spin' : ''} />
        </button>
      </div>

      <div style={{ 
        background: 'var(--bg-base)', 
        borderRadius: '12px', 
        padding: '32px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '16px',
        border: '1px dashed var(--border)',
        marginBottom: '20px'
      }}>
        {isCapturing ? (
          <div style={{ textAlign: 'center' }}>
            <div className="animate-pulse" style={{ color: 'var(--sidebar-active)', marginBottom: '12px' }}>
              <Fingerprint size={64} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Place your finger on scanner...</p>
          </div>
        ) : lastCapture?.success ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#059669' }}>Fingerprint Captured!</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', opacity: deviceStatus?.status === 'READY' ? 1 : 0.5 }}>
            <Fingerprint size={64} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {deviceStatus?.status === 'READY' ? 'Ready to scan' : 'Connect device to start'}
            </p>
          </div>
        )}
      </div>

      <button 
        onClick={handleCapture}
        disabled={isCapturing || deviceStatus?.status !== 'READY'}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', height: '44px' }}
      >
        {isCapturing ? (
          <>
            <RefreshCw size={18} className="animate-spin" />
            Capturing...
          </>
        ) : (
          <>
            <Smartphone size={18} />
            Start Capture
          </>
        )}
      </button>

      {lastCapture && !lastCapture.success && (
        <p style={{ 
          marginTop: '12px', 
          fontSize: '0.75rem', 
          color: '#ef4444', 
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.05)',
          padding: '8px',
          borderRadius: '6px'
        }}>
          Error {lastCapture.errorCode}: {lastCapture.errorInfo}
        </p>
      )}
    </div>
  );
}
