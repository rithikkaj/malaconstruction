import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { getSiteDashboard } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];
const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

export default function SiteDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteDashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="Site Dashboard" subtitle={user?.site_name}>
      <div className="loading-center"><div className="spinner" /></div>
    </Layout>
  );

  const { stats = {}, recentMaterials = [], materialBreakdown = [] } = data || {};

  return (
    <Layout title="Site Dashboard" subtitle={`Overview for ${user?.site_name || 'your site'}`}>
      <div className="stats-grid">
        <StatCard icon="👷" label="Workers" value={stats.worker_count || 0} colorClass="blue" />
        <StatCard icon="💸" label="Worker Wages" value={fmt(stats.total_wages || 0)} colorClass="green" />
        <StatCard icon="📦" label="Material Cost" value={fmt(stats.material_cost || 0)} colorClass="purple" />
        <StatCard icon="💰" label="Other Expenses" value={fmt(stats.expense_total || 0)} sub="approved" colorClass="amber" />
        <StatCard icon="⏳" label="Pending Expenses" value={stats.pending_expenses || 0} sub="awaiting approval" colorClass="red" />
      </div>

      <div className="charts-grid">
        <div className="panel">
          <div className="panel-header"><div className="panel-title">📦 Material Cost Breakdown</div></div>
          <div className="panel-body">
            {materialBreakdown.length === 0 ? (
              <div className="empty-state"><p>No material data yet. Start adding materials!</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={materialBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                    {materialBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><div className="panel-title">📋 Recent Materials Added</div></div>
          <div className="table-wrapper">
            {recentMaterials.length === 0 ? (
              <div className="empty-state"><p>No materials added yet.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Material</th><th>Qty</th><th>Rate</th><th>Total</th><th>Date</th></tr></thead>
                <tbody>
                  {recentMaterials.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{m.material_type}</td>
                      <td>{m.quantity} {m.unit}</td>
                      <td>₹{Number(m.rate).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(m.total_amount).toLocaleString('en-IN')}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(m.date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {stats.pending_expenses > 0 && (
        <div
          className="pending-alert"
          style={{
            marginTop: '20px',
          }}
        >
          ⚠️ You have <strong>{stats.pending_expenses}</strong> expense(s) pending approval from Super Admin.
        </div>
      )}

    </Layout>
  );
}
