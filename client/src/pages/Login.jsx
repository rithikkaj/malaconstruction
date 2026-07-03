import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const errorId = useMemo(() => `login-error-${Math.random().toString(16).slice(2)}`, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(form);
      loginUser(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'superadmin' ? '/dashboard' : '/site-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" role="region" aria-label="Sign in">
        <div className="login-card-inner">
          <div className="login-brand">
            <div className="login-logo-icon" aria-hidden="true">
              <span className="login-logo-mark">M</span>
            </div>
            <div className="login-logo-text">
              <h1>MALA CONSTRUCTION</h1>
              <p>Management System</p>
            </div>
          </div>

          <div className="login-header">
            <h2 className="login-title">Sign In</h2>
            <p className="login-subtitle">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {error && (
            <div className="login-error" id={errorId} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" aria-describedby={error ? errorId : undefined}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="admin@malaconstruction.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  className="login-link"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="password-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="login-aux-row">
              <label className="login-checkbox">
                <input type="checkbox" name="remember" defaultChecked />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="login-link"
                onClick={() => toast('Password reset is not configured yet.', { icon: 'ℹ️' })}
              >
                Forgot password?
              </button>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-foot">
            <div className="default-credentials" aria-label="Default credentials">
              <div className="default-credentials-title">Default Credentials</div>
              <div className="mt-2">admin@malaconstruction.com</div>
              <div className="mt-1">Admin@123</div>
            </div>

            <div className="login-muted-help">
              Use the credentials above in development environments.
            </div>
          </div>
        </div>
      </div>

      <div className="login-side" aria-hidden="true">
        <div className="login-side-card">
          <div className="login-side-badge">Secure • Fast • Built for construction ERP</div>
          <div className="login-side-title">One portal for sites, workers & expenses</div>
          <div className="login-side-list">
            <div className="login-side-item">📌 Role-based access</div>
            <div className="login-side-item">📊 Dashboards & reports</div>
            <div className="login-side-item">🧾 Expenses tracking</div>
          </div>
        </div>
      </div>
    </div>
  );
}

