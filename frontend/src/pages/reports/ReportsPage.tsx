import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../api/axios';

interface ReportRow {
  employeeCode: string;
  name: string;
  department: string;
  category: string;
  payrollType: string;
  breakfastCount: number;
  lunchCount: number;
  total: number;
}

const ReportsPage = () => {
  const [weeklyData, setWeeklyData] = useState<ReportRow[]>([]);
  const [biweeklyData, setBiweeklyData] = useState<ReportRow[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [loadingBiweekly, setLoadingBiweekly] = useState(false);
  const [error, setError] = useState('');

  const fetchWeekly = async () => {
    setLoadingWeekly(true);
    setError('');
    try {
      const { data } = await api.get('/records/report/weekly');
      setWeeklyData(data);
    } catch {
      setError('Error al cargar el reporte semanal');
    } finally {
      setLoadingWeekly(false);
    }
  };

  const fetchBiweekly = async () => {
    if (!startDate || !endDate) {
      setError('Seleccioná fecha de inicio y fin');
      return;
    }
    setLoadingBiweekly(true);
    setError('');
    try {
      const { data } = await api.get(`/records/report/biweekly?startDate=${startDate}&endDate=${endDate}`);
      setBiweeklyData(data);
    } catch {
      setError('Error al cargar el reporte quincenal');
    } finally {
      setLoadingBiweekly(false);
    }
  };

  const downloadCSV = (data: ReportRow[], filename: string) => {
    const headers = ['Código', 'Nombre', 'Departamento', 'Categoría', 'Jornada', 'Desayunos', 'Almuerzos', 'Total (₡)'];
    const rows = data.map((r) => [
      r.employeeCode, r.name, r.department, r.category,
      r.payrollType, r.breakfastCount, r.lunchCount, r.total,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ReportTable = ({ data }: { data: ReportRow[] }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <thead>
        <tr style={{ backgroundColor: '#0f172a' }}>
          {['Código', 'Nombre', 'Departamento', 'Categoría', 'Desayunos', 'Almuerzos', 'Total'].map((h) => (
            <th key={h} style={{
              padding: '14px 20px', textAlign: 'left', fontSize: '12px',
              fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={row.employeeCode} style={{
            backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}>
            <td style={{ padding: '14px 20px', color: '#64748b' }}>{row.employeeCode}</td>
            <td style={{ padding: '14px 20px', fontWeight: 500, color: '#0f172a' }}>{row.name}</td>
            <td style={{ padding: '14px 20px', color: '#64748b' }}>{row.department}</td>
            <td style={{ padding: '14px 20px', color: '#64748b' }}>{row.category}</td>
            <td style={{ padding: '14px 20px', textAlign: 'center', color: '#0f172a' }}>{row.breakfastCount}</td>
            <td style={{ padding: '14px 20px', textAlign: 'center', color: '#0f172a' }}>{row.lunchCount}</td>
            <td style={{ padding: '14px 20px', fontWeight: 600, color: '#2563eb' }}>
              ₡{row.total.toLocaleString()}
            </td>
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>
              No hay datos para mostrar
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <MainLayout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#0f172a' }}>Reportes de descuentos</h1>
        <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px' }}>Descargá los reportes para procesar la planilla</p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: '8px', padding: '14px 20px', marginBottom: '24px',
          fontSize: '14px', color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      {/* Reporte semanal */}
      <div style={{
        backgroundColor: '#f8fafc', borderRadius: '12px',
        border: '2px solid #0f172a', overflow: 'hidden', marginBottom: '24px',
      }}>
        <div style={{
          padding: '24px 32px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Reporte semanal</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Empleados con jornada semanal — semana anterior
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={fetchWeekly}
              disabled={loadingWeekly}
              style={{
                padding: '10px 20px', fontSize: '14px', borderRadius: '8px',
                border: '1px solid #e2e8f0', backgroundColor: 'white',
                cursor: 'pointer', color: '#0f172a', fontWeight: 500,
              }}
            >
              {loadingWeekly ? 'Cargando...' : 'Ver reporte'}
            </button>
            {weeklyData.length > 0 && (
              <button
                onClick={() => downloadCSV(weeklyData, 'reporte-semanal')}
                style={{
                  padding: '10px 20px', fontSize: '14px', borderRadius: '8px',
                  border: 'none', backgroundColor: '#0f172a',
                  cursor: 'pointer', color: 'white', fontWeight: 500,
                }}
              >
                Descargar CSV
              </button>
            )}
          </div>
        </div>
        {weeklyData.length > 0 && <ReportTable data={weeklyData} />}
      </div>

      {/* Reporte quincenal */}
      <div style={{
        backgroundColor: '#f8fafc', borderRadius: '12px',
        border: '2px solid #0f172a', overflow: 'hidden',
      }}>
        <div style={{
          padding: '24px 32px', borderBottom: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Reporte quincenal</h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Empleados con jornada quincenal — seleccioná el período
              </p>
            </div>
            {biweeklyData.length > 0 && (
              <button
                onClick={() => downloadCSV(biweeklyData, `reporte-quincenal-${startDate}-${endDate}`)}
                style={{
                  padding: '10px 20px', fontSize: '14px', borderRadius: '8px',
                  border: 'none', backgroundColor: '#0f172a',
                  cursor: 'pointer', color: 'white', fontWeight: 500,
                }}
              >
                Descargar CSV
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                Fecha inicio
              </label>
              <input
                type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '10px 14px', fontSize: '14px', color: '#0f172a',
                  backgroundColor: 'white', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                Fecha fin
              </label>
              <input
                type="date" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '10px 14px', fontSize: '14px', color: '#0f172a',
                  backgroundColor: 'white', outline: 'none',
                }}
              />
            </div>
            <button
              onClick={fetchBiweekly}
              disabled={loadingBiweekly}
              style={{
                padding: '10px 20px', fontSize: '14px', borderRadius: '8px',
                border: '1px solid #e2e8f0', backgroundColor: 'white',
                cursor: 'pointer', color: '#0f172a', fontWeight: 500,
              }}
            >
              {loadingBiweekly ? 'Cargando...' : 'Ver reporte'}
            </button>
          </div>
        </div>
        {biweeklyData.length > 0 && <ReportTable data={biweeklyData} />}
      </div>
    </MainLayout>
  );
};

export default ReportsPage;