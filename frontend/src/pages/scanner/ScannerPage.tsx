import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

interface ScanResult {
  success: boolean;
  message: string;
  employee?: string;
  mealType?: string;
  amount?: number;
}

interface DailyCount {
  breakfast: number;
  lunch: number;
}

const ScannerPage = () => {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<'DESAYUNO' | 'ALMUERZO' | null>(null);
  const [dailyCount, setDailyCount] = useState<DailyCount>({ breakfast: 0, lunch: 0 });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const fetchDashboard = async () => {
    try {
      const [dashRes, mealRes] = await Promise.all([
        api.get('/records/dashboard'),
        api.get('/schedule/current'),
      ]);
      setDailyCount({
        breakfast: dashRes.data.daily.breakfast.count,
        lunch: dashRes.data.daily.lunch.count,
      });
      setCurrentMeal(mealRes.data.mealType);
    } catch {}
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const startScanner = async () => {
    const html5Qrcode = new Html5Qrcode('qr-reader');
    scannerRef.current = html5Qrcode;
    setScanning(true);

    await html5Qrcode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        if (cooldownRef.current) return;
        cooldownRef.current = true;

        try {
          const { data } = await api.post<ScanResult>('/records/scan', { cedula: decodedText });
          setResult(data);
          if (data.success) fetchDashboard();
        } catch (error: any) {
          setResult({
            success: false,
            message: error.response?.data?.message ?? 'Error al procesar el escaneo',
          });
        }

        setTimeout(() => {
          cooldownRef.current = false;
          setResult(null);
        }, 3000);
      },
      () => {}
    );
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleSalir = async () => {
    await stopScanner();
    if (user?.role === 'CAJERO') {
      logout();
      navigate('/login');
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const count = currentMeal === 'DESAYUNO' ? dailyCount.breakfast : dailyCount.lunch;
  const label = currentMeal === 'DESAYUNO' ? 'Desayunos' : currentMeal === 'ALMUERZO' ? 'Almuerzos' : null;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-medium">Digital Tickets</h1>
            <p className="text-slate-400 text-sm mt-1">Acercá el carnet al lector</p>
          </div>
          <button
            onClick={handleSalir}
            style={{
              background: 'none',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {user?.role === 'CAJERO' ? 'Cerrar sesión' : 'Volver al menú'}
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl overflow-hidden mb-6">
          <div id="qr-reader" className="w-full" />
          {!scanning && (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-500 text-sm">Cámara inactiva</p>
            </div>
          )}
        </div>

        {result && (
          <div className={`rounded-xl p-4 mb-6 text-center transition-all ${
            result.success
              ? 'bg-green-500/20 border border-green-500/30'
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            <p className={`text-lg font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? '✓' : '✕'} {result.message}
            </p>
            {result.success && result.employee && (
              <div className="mt-2 space-y-1">
                <p className="text-white text-sm">{result.employee}</p>
                <p className="text-slate-400 text-xs">
                  {result.mealType === 'DESAYUNO' ? 'Desayuno' : 'Almuerzo'} — ₡{result.amount?.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mb-4">
          {!scanning ? (
            <button
              onClick={startScanner}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            >
              Iniciar escáner
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex-1 bg-slate-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-slate-600 transition"
            >
              Detener escáner
            </button>
          )}
        </div>

        {label && (
          <div style={{
            backgroundColor: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '13px', color: '#86efac' }}>{label} hoy</span>
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#4ade80' }}>{count}</span>
          </div>
        )}

        {!label && (
          <div style={{
            backgroundColor: 'rgba(100,116,139,0.1)',
            border: '1px solid rgba(100,116,139,0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Fuera de horario de comidas</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default ScannerPage;