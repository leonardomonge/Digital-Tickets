import { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../api/axios';
import { Role } from '../../types';

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface UserModalProps {
  onClose: () => void;
  onSave: () => void;
}

const UserModal = ({ onClose, onSave }: UserModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ADMIN' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/users', form);
      onSave();
      onClose();
    } catch {
      setError('Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '32px',
        width: '100%', maxWidth: '440px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>Crear usuario</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Nombre', name: 'name', type: 'text' },
            { label: 'Correo', name: 'email', type: 'email' },
            { label: 'Contraseña', name: 'password', type: 'password' },
          ].map((field) => (
            <div key={field.name}>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>{field.label}</label>
              <input
                name={field.name} type={field.type}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                style={{
                  width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '10px 14px', fontSize: '14px', color: '#0f172a', outline: 'none',
                }}
              />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Rol</label>
            <select
              name="role" value={form.role} onChange={handleChange}
              style={{
                width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
                padding: '10px 14px', fontSize: '14px', color: '#0f172a', outline: 'none',
                backgroundColor: 'white',
              }}
            >
              <option value="ADMIN">Admin</option>
              <option value="CAJERO">Cajero</option>
            </select>
          </div>
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
          }}>
            {loading ? 'Guardando...' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    await api.delete(`/users/${id}`);
    fetchUsers();
  };

  const roleLabel = (role: Role) => {
    if (role === Role.SUPER_ADMIN) return 'Super Admin';
    if (role === Role.ADMIN) return 'Admin';
    return 'Cajero';
  };

  const roleColors: Record<Role, { bg: string; color: string }> = {
    [Role.SUPER_ADMIN]: { bg: '#fef3c7', color: '#d97706' },
    [Role.ADMIN]: { bg: '#dbeafe', color: '#1d4ed8' },
    [Role.CAJERO]: { bg: '#dcfce7', color: '#15803d' },
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#0f172a' }}>Usuarios</h1>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px' }}>Gestión de usuarios del sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#0f172a', color: 'white', border: 'none',
            borderRadius: '8px', padding: '10px 20px', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer',
          }}
        >
          + Crear usuario
        </button>
      </div>

      <div style={{
        backgroundColor: '#f8fafc', borderRadius: '12px',
        border: '2px solid #0f172a', overflow: 'hidden', width: '100%',
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <p style={{ color: '#94a3b8', fontSize: '15px' }}>Cargando...</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Nombre', 'Correo', 'Rol', 'Fecha de creación', 'Acciones'].map((h) => (
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
              {users.map((user, index) => (
                <tr key={user.id} style={{
                  backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                }}>
                  <td style={{ padding: '14px 20px', fontWeight: 500, color: '#0f172a' }}>{user.name}</td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>{user.email}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                      backgroundColor: roleColors[user.role].bg,
                      color: roleColors[user.role].color,
                    }}>
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>
                    {new Date(user.createdAt).toLocaleDateString('es-CR')}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {user.role !== Role.SUPER_ADMIN && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#dc2626', fontSize: '13px', fontWeight: 500,
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <UserModal
          onClose={() => setShowModal(false)}
          onSave={fetchUsers}
        />
      )}
    </MainLayout>
  );
};

export default UsersPage;