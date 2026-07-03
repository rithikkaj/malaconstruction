import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import SuperDashboard from './pages/superadmin/Dashboard';
import Sites from './pages/superadmin/Sites';
import Admins from './pages/superadmin/Admins';
import Workers from './pages/superadmin/Workers';
import Expenses from './pages/superadmin/Expenses';
import Reports from './pages/superadmin/Reports';
import SiteDashboard from './pages/siteadmin/SiteDashboard';
import Materials from './pages/siteadmin/Materials';
import SiteWorkers from './pages/siteadmin/SiteWorkers';
import SiteExpenses from './pages/siteadmin/SiteExpenses';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e2d40',
              color: '#f1f5f9',
              border: '1px solid #2a3a52',
              borderRadius: '10px',
              fontSize: '13.5px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Super Admin Routes */}
          <Route path="/dashboard" element={<PrivateRoute role="superadmin"><SuperDashboard /></PrivateRoute>} />
          <Route path="/sites" element={<PrivateRoute role="superadmin"><Sites /></PrivateRoute>} />
          <Route path="/admins" element={<PrivateRoute role="superadmin"><Admins /></PrivateRoute>} />
          <Route path="/workers" element={<PrivateRoute role="superadmin"><Workers /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute role="superadmin"><Expenses /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute role="superadmin"><Reports /></PrivateRoute>} />

          {/* Site Admin Routes */}
          <Route path="/site-dashboard" element={<PrivateRoute role="siteadmin"><SiteDashboard /></PrivateRoute>} />
          <Route path="/materials" element={<PrivateRoute role="siteadmin"><Materials /></PrivateRoute>} />
          <Route path="/site-workers" element={<PrivateRoute role="siteadmin"><SiteWorkers /></PrivateRoute>} />
          <Route path="/site-expenses" element={<PrivateRoute role="siteadmin"><SiteExpenses /></PrivateRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
