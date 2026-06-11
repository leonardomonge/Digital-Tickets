import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('es-CR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Sidebar />
      <div style={{
        position: 'absolute',
        left: '260px',
        right: '0',
        top: '0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f1f5f9',
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Bienvenido,{' '}
              <span style={{ color: '#2563eb', fontWeight: 500 }}>{user?.name}</span>
            </p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {user?.role === 'SUPER_ADMIN'
                ? 'Super Administrador'
                : user?.role === 'ADMIN'
                ? 'Administrador'
                : 'Cajero'}
            </p>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'capitalize' }}>{today}</p>
        </header>

        {/* Contenido */}
        <main style={{ flex: 1, padding: '32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;