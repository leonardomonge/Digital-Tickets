import { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../api/axios';
import type { Employee } from '../../types';
import EmployeeModal from '../../components/shared/EmployeeModal';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchEmployees = () => {
    setLoading(true);
    api.get('/employees')
      .then((res) => setEmployees(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
    await api.delete(`/employees/${id}`);
    fetchEmployees();
  };

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.cedula.includes(search) ||
    e.employeeCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#0f172a' }}>Empleados</h1>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px' }}>Gestión de empleados registrados</p>
        </div>
        <button
          onClick={handleAdd}
          style={{
            backgroundColor: '#0f172a', color: 'white', border: 'none',
            borderRadius: '8px', padding: '10px 20px', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer',
          }}
        >
          + Agregar empleado
        </button>
      </div>

      {/* Tabla */}
      <div style={{
        backgroundColor: '#f8fafc', borderRadius: '12px',
        border: '2px solid #0f172a', overflow: 'hidden',
        width: '100%',
      }}>
        {/* Buscador */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '10px 16px', fontSize: '14px', color: '#0f172a',
              backgroundColor: 'white', outline: 'none',
            }}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <p style={{ color: '#94a3b8', fontSize: '15px' }}>Cargando...</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Código', 'Nombre', 'Cédula', 'Departamento', 'Categoría', 'Jornada', 'Estado', 'Acciones'].map((h) => (
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
              {filtered.map((employee, index) => (
                <tr key={employee.id} style={{
                  backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                }}>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>{employee.employeeCode}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 500, color: '#0f172a' }}>{employee.name}</td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>{employee.cedula}</td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>{employee.department}</td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>{employee.category.name}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                      backgroundColor: employee.payrollType === 'SEMANAL' ? '#dbeafe' : '#ede9fe',
                      color: employee.payrollType === 'SEMANAL' ? '#1d4ed8' : '#7c3aed',
                    }}>
                      {employee.payrollType}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                      backgroundColor: employee.active ? '#dcfce7' : '#fee2e2',
                      color: employee.active ? '#15803d' : '#dc2626',
                    }}>
                      {employee.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      onClick={() => handleEdit(employee)}
                      style={{
                        backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#2563eb', fontSize: '13px', fontWeight: 500, marginRight: '12px',
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      style={{
                        backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#dc2626', fontSize: '13px', fontWeight: 500,
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>
                    No se encontraron empleados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setShowModal(false)}
          onSave={fetchEmployees}
        />
      )}
    </MainLayout>
  );
};

export default EmployeesPage;