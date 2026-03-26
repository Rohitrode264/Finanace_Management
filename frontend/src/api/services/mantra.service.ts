/**
 * Mantra Service to handle MFS100 Fingerprint Scanner
 * Communicates with the local Mantra RD Service (HTTP bridge)
 */

export interface RDServiceInfo {
  status: 'READY' | 'NOTREADY' | 'DISCONNECTED';
  info: string;
  port: number;
}

export interface CaptureResponse {
  success: boolean;
  errorCode: string;
  errorInfo: string;
  pidData?: string; // Encrypted PID Data (XML)
  data?: any; // Parsed data if needed
}

class MantraService {
  private defaultPorts = [11100, 11101, 11102, 11103, 11104, 11105];
  private activePort: number | null = null;

  /**
   * Scans for the Mantra RD Service on local ports
   */
  async discoverPort(): Promise<number | null> {
    for (const port of this.defaultPorts) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, {
          method: 'DEVICEINFO', // Special Mantra command to check service
        });
        if (response.ok) {
          const text = await response.text();
          if (text.includes('RDService')) {
            this.activePort = port;
            console.log(`Mantra RD Service discovered on port ${port}`);
            return port;
          }
        }
      } catch (err) {
        // Continue scanning
      }
    }
    return null;
  }

  /**
   * Gets device information and status
   */
  async getDeviceInfo(): Promise<RDServiceInfo> {
    const port = this.activePort || (await this.discoverPort());
    if (!port) {
      return { status: 'DISCONNECTED', info: 'RD Service not found', port: 0 };
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/rd/info`, {
        method: 'DEVICEINFO',
      });
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const status = xmlDoc.getElementsByTagName('RDService')[0]?.getAttribute('status');

      return {
        status: status === 'READY' ? 'READY' : 'NOTREADY',
        info: xmlText,
        port,
      };
    } catch (err) {
      this.activePort = null;
      return { status: 'DISCONNECTED', info: 'Error connecting to device', port: 0 };
    }
  }

  /**
   * Captures a fingerprint
   * @param timeout Request timeout in milliseconds
   */
  async captureFingerprint(timeout: number = 10000): Promise<CaptureResponse> {
    const port = this.activePort || (await this.discoverPort());
    if (!port) {
      return { success: false, errorCode: '-1', errorInfo: 'RD Service not found' };
    }

    // Capture Options XML
    const optionsXml = `
      <Opts fCount="1" fType="0" iCount="0" iType="0" pCount="0" pType="0" format="0" pidVer="2.0" timeout="${timeout}" otp="" wadh="" posh="" env="P" />
    `.trim();

    try {
      const response = await fetch(`http://127.0.0.1:${port}/rd/capture`, {
        method: 'CAPTURE',
        body: optionsXml,
        headers: {
          'Content-Type': 'text/xml',
          'Accept': 'text/xml',
        },
      });

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const respElement = xmlDoc.getElementsByTagName('Resp')[0];
      const errCode = respElement?.getAttribute('errCode');
      const errInfo = respElement?.getAttribute('errInfo');

      if (errCode === '0') {
        return {
          success: true,
          errorCode: '0',
          errorInfo: 'Success',
          pidData: xmlText, // The whole XML should be sent to server for verification
        };
      } else {
        return {
          success: false,
          errorCode: errCode || 'unknown',
          errorInfo: errInfo || 'Capture failed',
        };
      }
    } catch (err) {
      return { success: false, errorCode: '-2', errorInfo: 'Network error or device disconnected' };
    }
  }

  /**
   * Utility to reset/re-discover
   */
  reset() {
    this.activePort = null;
  }
}

export const mantraService = new MantraService();
