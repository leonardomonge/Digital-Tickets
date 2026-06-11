import { useEffect, useState } from 'react';
import type { Employee, Category } from '../../types';
import api from '../../api/axios';

interface EmployeeModalProps {
  employee?: Employee | null;
  onClose: () => void;
  onSave: () => void;
}

const DEPARTMENTS = [
  'Produccion', 'Inventarios', 'Calidad', 'Mantenimiento',
  'Administrativo', 'CrossMarketing', 'Dipo', 'ISG', 'Otro',
];

const EmployeeModal = ({ employee, onClose, onSave }: EmployeeModalProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    employeeCode: employee?.employeeCode ?? '',
    name: employee?.name ?? '',
    cedula: employee?.cedula ?? '',
    department: employee?.department ?? '',
    payrollType: employee?.payrollType ?? 'SEMANAL',
    categoryId: employee?.categoryId ?? '',
    active: employee?.active ?? true,
  });

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (employee) {
        await api.put(`/employees/${employee.id}`, { ...form, categoryId: Number(form.categoryId) });
      } else {
        await api.post('/employees', { ...form, categoryId: Number(form.categoryId) });
      }
      onSave();
      onClose();
    } catch {
      setError('Error al guardar el empleado');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    backgroundColor: 'white',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '32px',
        width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
            {employee ? 'Editar empleado' : 'Agregar empleado'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Código</label>
              <input name="employeeCode" value={form.employeeCode} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Cédula</label>
              <input name="cedula" value={form.cedula} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Nombre completo</label>
            <input name="name" value={form.name} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Departamento</label>
            <select name="department" value={form.department} onChange={handleChange} style={inputStyle}>
              <option value="">Seleccionar...</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Categoría</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange} style={inputStyle}>
                <option value="">Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Jornada</label>
              <select name="payrollType" value={form.payrollType} onChange={handleChange} style={inputStyle}>
                <option value="SEMANAL">Semanal</option>
                <option value="QUINCENAL">Quincenal</option>
              </select>
            </div>
          </div>

          {employee && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Estado</label>
              <select
                value={form.active ? 'true' : 'false'}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.value === 'true' }))}
                style={inputStyle}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          )}

        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', fontSize: '14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#64748b',
          }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            padding: '10px 20px', fontSize: '14px', borderRadius: '8px',
            border: 'none', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmployeeModal;