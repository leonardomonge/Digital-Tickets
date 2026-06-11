import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';
import type { ReactNode } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
}

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ScannerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
  </svg>
);

const EmployeesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ReportsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

const CategoriesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const ScheduleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, roles: ['ADMIN', 'SUPER_ADMIN'] as Role[] },
  { path: '/scanner', label: 'Escáner', icon: <ScannerIcon />, roles: ['ADMIN', 'SUPER_ADMIN', 'CAJERO'] as Role[] },
  { path: '/employees', label: 'Empleados', icon: <EmployeesIcon />, roles: ['ADMIN', 'SUPER_ADMIN'] as Role[] },
  { path: '/reports', label: 'Reportes', icon: <ReportsIcon />, roles: ['ADMIN', 'SUPER_ADMIN'] as Role[] },
  { path: '/categories', label: 'Categorías', icon: <CategoriesIcon />, roles: ['ADMIN', 'SUPER_ADMIN'] as Role[] },
  { path: '/schedule', label: 'Horarios', icon: <ScheduleIcon />, roles: ['ADMIN', 'SUPER_ADMIN'] as Role[] },
];

const adminItems: NavItem[] = [
  { path: '/users', label: 'Usuarios', icon: <UsersIcon />, roles: ['SUPER_ADMIN'] as Role[] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filtered = navItems.filter(item => user && item.roles.includes(user.role));
  const filteredAdmin = adminItems.filter(item => user && item.roles.includes(user.role));

  const initials = user?.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', backgroundColor: '#2563eb',
            borderRadius: '10px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white',
          }}>
            DT
          </div>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'white', lineHeight: 1.2 }}>Digital Tickets</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Sistema de tiquetes</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filtered.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'white' : '#94a3b8',
                backgroundColor: isActive ? '#2563eb' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              })}
              onMouseEnter={e => {
                const el = e.currentTarget;
                if (!el.classList.contains('active')) {
                  el.style.backgroundColor = 'rgba(255,255,255,0.06)';
                  el.style.color = 'white';
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                if (!el.classList.contains('active')) {
                  el.style.backgroundColor = 'transparent';
                  el.style.color = '#94a3b8';
                }
              }}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          {filteredAdmin.length > 0 && (
            <>
              <p style={{
                fontSize: '11px', fontWeight: 600, color: '#475569',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '16px 14px 6px',
              }}>
                Administración
              </p>
              {filteredAdmin.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'white' : '#94a3b8',
                    backgroundColor: isActive ? '#2563eb' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  })}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </div>
      </nav>

      {/* Usuario */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 14px', marginBottom: '4px',
        }}>
          <div style={{
            width: '36px', height: '36px', backgroundColor: '#2563eb',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '13px', fontWeight: 600,
            color: 'white', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </p>
            <p style={{ fontSize: '12px', color: '#64748b' }}>{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 14px', borderRadius: '8px', fontSize: '14px',
            color: '#94a3b8', backgroundColor: 'transparent', border: 'none',
            cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLButtonElement).style.color = 'white';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
          }}
        >
          <LogoutIcon />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;