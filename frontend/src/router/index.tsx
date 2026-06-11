import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../guards/ProtectedRoute';
import { Role } from '../types';
import UsersPage from '../pages/users/UsersPage';

import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import EmployeesPage from '../pages/employees/EmployeesPage';
import CategoriesPage from '../pages/categories/CategoriesPage';
import SchedulePage from '../pages/schedule/SchedulePage';
import ReportsPage from '../pages/reports/ReportsPage';
import ScannerPage from '../pages/scanner/ScannerPage';

const AppRouter = () => {
  const { isAuthenticated, user } = useAuth();

  const defaultRedirect = isAuthenticated
    ? user?.role === Role.CAJERO
      ? '/scanner'
      : '/dashboard'
    : '/login';

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={defaultRedirect} replace /> : <LoginPage />}
        />
        <Route
          path="/scanner"
          element={
            <ProtectedRoute allowedRoles={[Role.CAJERO, Role.ADMIN, Role.SUPER_ADMIN]}>
              <ScannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
              <SchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={defaultRedirect} replace />} />
        <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;