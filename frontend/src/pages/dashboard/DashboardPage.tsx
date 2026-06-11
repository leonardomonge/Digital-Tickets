import { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../api/axios';

interface PeriodData {
  breakfast: { count: number; amount: number };
  lunch: { count: number; amount: number };
}

interface DashboardData {
  daily: PeriodData;
  weekly: PeriodData;
}

const StatCard = ({ label, data }: { label: string; data: PeriodData }) => (
  <div style={{
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '2px solid #0f172a',
    padding: '28px 32px',
    flex: 1,
  }}>
    <h2 style={{
      fontSize: '13px', fontWeight: 600, color: '#0f172a',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '24px',
    }}>
      {label}
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '10px',
        border: '1px solid #e2e8f0', padding: '20px 24px',
      }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>Desayunos</p>
        <p style={{ fontSize: '36px', fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>{data.breakfast.count}</p>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>₡{data.breakfast.amount.toLocaleString()}</p>
      </div>
      <div style={{
        backgroundColor: 'white', borderRadius: '10px',
        border: '1px solid #e2e8f0', padding: '20px 24px',
      }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>Almuerzos</p>
        <p style={{ fontSize: '36px', fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>{data.lunch.count}</p>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>₡{data.lunch.amount.toLocaleString()}</p>
      </div>
      <div style={{
        backgroundColor: '#0f172a', borderRadius: '10px',
        border: '1px solid #0f172a', padding: '20px 24px',
      }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>Total</p>
        <p style={{ fontSize: '36px', fontWeight: 600, color: 'white', lineHeight: 1 }}>
          {data.breakfast.count + data.lunch.count}
        </p>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
          ₡{(data.breakfast.amount + data.lunch.amount).toLocaleString()}
        </p>
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/records/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#0f172a' }}>Dashboard</h1>
        <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px' }}>Resumen de consumo de tiquetes</p>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {data && <StatCard label="Hoy" data={data.daily} />}
        {data && <StatCard label="Esta semana" data={data.weekly} />}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;