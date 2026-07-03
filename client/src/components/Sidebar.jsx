import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Building2, Users, Package, DollarSign,
  BarChart3, LogOut, HardHat, ShoppingCart, KeyRound
} from 'lucide-react';
import { changePassword } from '../api/api';
import Modal from './Modal';
import toast from 'react-hot-toast';

const SuperAdminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sites', icon: Building2, label: 'Manage Sites' },
  { to: '/admins', icon: Users, label: 'Site Admins' },
  { to: '/workers', icon: HardHat, label: 'Workers' },
  { to: '/expenses', icon: DollarSign, label: 'Expenses' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

const SiteAdminNav = [
  { to: '/site-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/materials', icon: ShoppingCart, label: 'Materials' },
  { to: '/site-workers', icon: HardHat, label: 'Workers' },
  { to: '/site-expenses', icon: DollarSign, label: 'Expenses' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = user?.role === 'superadmin' ? SuperAdminNav : SiteAdminNav;

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters.");
    }
    setPwSaving(true);
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏗️</div>
        <div className="sidebar-logo-text">
          <h2>MALA</h2>
          <p>Construction Mgmt</p>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-user-info" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 2 }}>
            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div className="sidebar-user-role">
              {user?.role === 'superadmin' ? 'Super Admin' : `Site Admin${user?.site_name ? ` · ${user.site_name}` : ''}`}
            </div>
          </div>
          <button 
            className="btn btn-icon btn-outline" 
            style={{ border: 'none', background: 'transparent', width: 28, height: 28, flexShrink: 0, padding: 0 }} 
            title="Change Password" 
            onClick={() => setShowPasswordModal(true)}
          >
            <KeyRound size={14} />
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {showPasswordModal && (
        <Modal title="🔑 Change Password" onClose={() => setShowPasswordModal(false)}>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <input
                type="password"
                className="form-control"
                value={pwForm.currentPassword}
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                type="password"
                className="form-control"
                placeholder="Min 6 characters"
                value={pwForm.newPassword}
                onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                className="form-control"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </aside>
  );
}
