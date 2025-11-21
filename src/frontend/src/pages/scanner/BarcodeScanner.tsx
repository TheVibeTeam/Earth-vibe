import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import styles from '../css/BarcodeScanner.module.css';

interface ProductData {
  barcode: string;
  productName: string;
  brand: string;
  category?: string;
  quantity?: string;
  points: number;
  isActive: boolean;
  imageUrl?: string;
}

interface ScanResult extends ProductData {
  qrCode: string;
  timestamp: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function BarcodeScanner() {
  const [barcode, setBarcode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generar QR en el frontend
  const generateQRCode = async (data: ProductData): Promise<string> => {
    const qrData = JSON.stringify({
      barcode: data.barcode,
      product: data.productName,
      brand: data.brand,
      points: data.points,
    });
    
    return await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });
  };

  // Procesar código de barras
  const processBarcode = async (code: string) => {
    if (!code || code.length < 8) {
      setError('Código de barras inválido');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/earthvibe/process-barcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code }),
      });

      const json = await response.json();

      if (json.success) {
        const qrCode = await generateQRCode(json.data);
        const scanResult: ScanResult = {
          ...json.data,
          qrCode,
          timestamp: new Date().toISOString(),
        };
        
        setResult(scanResult);
        setScanHistory((prev) => [scanResult, ...prev.slice(0, 9)]);
        setBarcode('');
      } else {
        setError(json.message || 'Producto no encontrado');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setIsProcessing(false);
    }
  };

  // Detectar scanner USB (envía dígitos + Enter)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 8) {
          processBarcode(bufferRef.current);
        }
        bufferRef.current = '';
      } else if (e.key.match(/[0-9]/)) {
        bufferRef.current += e.key;
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcode(barcode);
  };

  const downloadQR = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.qrCode;
    link.download = `qr-${result.barcode}.png`;
    link.click();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Scanner de Códigos de Barras</h1>
        <div className={styles.scannerInfo}>
          <span className={styles.badge}>
            <span className={styles.statusDot}></span>
            Escaneando...
          </span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.inputSection}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Escanea o ingresa el código</h2>
            
            <div className={styles.scannerIcon}>📷</div>
            <p className={styles.instruction}>
              Apunta el scanner al código de barras
            </p>
            
            {isProcessing && (
              <div className={styles.loader}>
                <div className={styles.spinner}></div>
                <p>Procesando...</p>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className={styles.manualForm}>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="O ingresa manualmente: 7501055363322"
                className={styles.input}
                pattern="[0-9]{8,14}"
              />
              <button
                type="submit"
                disabled={isProcessing || barcode.length < 8}
                className={styles.submitButton}
              >
                {isProcessing ? 'Procesando...' : 'Generar QR'}
              </button>
            </form>

            {error && (
              <div className={styles.errorAlert}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className={styles.resultSection}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Código QR</h2>
                <button onClick={downloadQR} className={styles.downloadButton}>
                  💾 Descargar
                </button>
              </div>

              <div className={styles.qrDisplay}>
                <img src={result.qrCode} alt="QR Code" className={styles.qrImage} />
              </div>

              <div className={styles.productInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Código:</span>
                  <span className={styles.value}>{result.barcode}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Producto:</span>
                  <span className={styles.value}>{result.productName}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Marca:</span>
                  <span className={styles.value}>{result.brand}</span>
                </div>
                {result.quantity && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Cantidad:</span>
                    <span className={styles.value}>{result.quantity}</span>
                  </div>
                )}
                <div className={styles.infoRow}>
                  <span className={styles.label}>Puntos:</span>
                  <span className={`${styles.value} ${styles.points}`}>
                    ⭐ {result.points}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {scanHistory.length > 0 && (
          <div className={styles.historySection}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Historial</h2>
              <div className={styles.historyList}>
                {scanHistory.map((scan, index) => (
                  <div
                    key={`${scan.barcode}-${index}`}
                    className={styles.historyItem}
                    onClick={() => setResult(scan)}
                  >
                    <div className={styles.historyIcon}>📦</div>
                    <div className={styles.historyInfo}>
                      <div className={styles.historyName}>{scan.productName}</div>
                      <div className={styles.historyBarcode}>{scan.barcode}</div>
                    </div>
                    <div className={styles.historyPoints}>⭐ {scan.points}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
