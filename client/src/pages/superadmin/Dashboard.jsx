import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { getDashboardStats } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#a855f7'];
const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;


export default function SuperDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for AuthContext so localStorage token/profile is available.
    if (authLoading) return;

    const token = localStorage.getItem('mc_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    getDashboardStats()
      .then((r) => setData(r.data))
      .catch((e) => {
        console.error('[SuperDashboard] getDashboardStats failed:', e);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [authLoading]);


  if (loading) return (
    <Layout title="Dashboard" subtitle="Super Admin Overview">
      <div className="loading-center"><div className="spinner" /></div>
    </Layout>
  );

  const { stats = {}, expenseBreakdown = [], siteWiseExpenses = [], monthlyExpenses = [] } = data || {};

  return (
    <Layout title="Dashboard" subtitle="Real-time overview of all sites">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="🏗️" label="Total Sites" value={stats.total_sites || 0} sub={`${stats.active_sites || 0} active`} colorClass="amber" />
        <StatCard icon="👷" label="Total Workers" value={Number(stats.total_workers || 0).toLocaleString()} colorClass="blue" />
        <StatCard icon="💸" label="Worker Payments" value={fmt(stats.total_payments || 0)} colorClass="green" />
        <StatCard icon="📦" label="Material Cost" value={fmt(stats.total_material_cost || 0)} colorClass="purple" />
        <StatCard icon="💰" label="Other Expenses" value={fmt(stats.total_expenses || 0)} sub="approved only" colorClass="red" />
        <StatCard icon="📊" label="Grand Total" value={fmt((stats.total_payments || 0) + (stats.total_material_cost || 0) + (stats.total_expenses || 0))} colorClass="indigo" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Monthly Trend */}
        <div className="panel chart-full">
          <div className="panel-header">
            <div className="panel-title">📈 Monthly Expense Trend (Approved)</div>
          </div>
          <div className="panel-body">
            {monthlyExpenses.length === 0 ? (
              <div className="empty-state"><p>No monthly data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Site-wise Bar */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">🏗️ Site-wise Costs</div>
          </div>
          <div className="panel-body">
            {siteWiseExpenses.length === 0 ? (
              <div className="empty-state"><p>No site data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={siteWiseExpenses} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="materials" fill="#3b82f6" name="Materials" radius={[4,4,0,0]} />
                  <Bar dataKey="payments" fill="#10b981" name="Workers" radius={[4,4,0,0]} />
                  <Bar dataKey="expenses" fill="#f59e0b" name="Other Expenses" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Breakdown Pie */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">🍕 Expense Breakdown by Category</div>
          </div>
          <div className="panel-body">
            {expenseBreakdown.length === 0 ? (
              <div className="empty-state"><p>No expense data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={expenseBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
