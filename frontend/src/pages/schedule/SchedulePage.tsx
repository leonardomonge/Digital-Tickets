import { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../api/axios';

const SchedulePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [breakfast, setBreakfast] = useState({ startTime: '', endTime: '' });
  const [lunch, setLunch] = useState({ startTime: '', endTime: '' });

  const fetchSchedules = () => {
    api.get('/schedule').then((res) => {
      const data = res.data;
      const b = data.find((s: any) => s.mealType === 'DESAYUNO');
      const l = data.find((s: any) => s.mealType === 'ALMUERZO');
      if (b) setBreakfast({ startTime: b.startTime, endTime: b.endTime });
      if (l) setLunch({ startTime: l.startTime, endTime: l.endTime });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSchedules(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/schedule', { mealType: 'DESAYUNO', ...breakfast });
      await api.put('/schedule', { mealType: 'ALMUERZO', ...lunch });
      setSuccess('Horarios actualizados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al guardar los horarios');
    } finally {
      setSaving(false);
    }
  };

  const TimeCard = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: { startTime: string; endTime: string };
    onChange: (val: { startTime: string; endTime: string }) => void;
  }) => (
    <div style={{
      backgroundColor: '#f8fafc', borderRadius: '12px',
      border: '2px solid #0f172a', padding: '5px 32px', flex: 1,
    }}>
      <h2 style={{
        fontSize: '13px', fontWeight: 600, color: '#0f172a',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '24px',
      }}>
        {label}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
            Hora de inicio
          </label>
          <input
            type="time"
            value={value.startTime}
            onChange={(e) => onChange({ ...value, startTime: e.target.value })}
            style={{
              width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '10px 14px', fontSize: '15px', color: '#0f172a',
              backgroundColor: 'white', outline: 'none',
            }}
          />
        </div>
        <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
            Hora de cierre
          </label>
          <input
            type="time"
            value={value.endTime}
            onChange={(e) => onChange({ ...value, endTime: e.target.value })}
            style={{
              width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '10px 14px', fontSize: '15px', color: '#0f172a',
              backgroundColor: 'white', outline: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <MainLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <p style={{ color: '#94a3b8', fontSize: '15px' }}>Cargando...</p>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#0f172a' }}>Horarios</h1>
        <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px' }}>
          Configuración de horarios de desayuno y almuerzo
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        <TimeCard label="Desayuno" value={breakfast} onChange={setBreakfast} />
        <TimeCard label="Almuerzo" value={lunch} onChange={setLunch} />
      </div>

      {success && (
        <div style={{
          backgroundColor: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: '8px', padding: '14px 20px', marginBottom: '20px',
          fontSize: '14px', color: '#15803d',
        }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: '8px', padding: '14px 20px', marginBottom: '20px',
          fontSize: '14px', color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            backgroundColor: '#0f172a', color: 'white', border: 'none',
            borderRadius: '8px', padding: '12px 28px', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Guardando...' : 'Guardar horarios'}
        </button>
      </div>
    </MainLayout>
  );
};

export default SchedulePage;