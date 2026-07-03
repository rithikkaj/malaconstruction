import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getMonthlyReport, getSiteWiseReport, getTotalExpensesReport, getDailyReport } from '../../api/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#a855f7'];
const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

export default function Reports() {
  const [tab, setTab] = useState('monthly');
  const [monthlyData, setMonthlyData] = useState(null);
  const [siteData, setSiteData] = useState([]);
  const [totalData, setTotalData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (tab === 'monthly') loadMonthly();
    else if (tab === 'sitewise') loadSiteWise();
    else if (tab === 'total') loadTotal();
    else if (tab === 'daily') loadDaily();
  }, [tab]);

  const loadMonthly = () => {
    setLoading(true);
    getMonthlyReport({ month, year }).then(r => setMonthlyData(r.data)).finally(() => setLoading(false));
  };
  const loadSiteWise = () => {
    setLoading(true);
    getSiteWiseReport().then(r => setSiteData(r.data)).finally(() => setLoading(false));
  };
  const loadTotal = () => {
    setLoading(true);
    getTotalExpensesReport().then(r => setTotalData(r.data)).finally(() => setLoading(false));
  };
  const loadDaily = () => {
    setLoading(true);
    getDailyReport({ date: dailyDate }).then(r => setDailyData(r.data)).finally(() => setLoading(false));
  };

  const tabs = [
    { key: 'monthly', label: '📅 Monthly' },
    { key: 'daily', label: '📋 Daily' },
    { key: 'sitewise', label: '🏗️ Site-wise' },
    { key: 'total', label: '💰 Total Expenses' },
  ];

  return (
    <Layout title="Reports & Analytics" subtitle="Generate comprehensive reports across all sites">
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 18px', borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            background: tab === t.key ? 'var(--bg-card)' : 'transparent',
            color: tab === t.key ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: tab === t.key ? 700 : 400,
            borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
            fontSize: 13, cursor: 'pointer', border: 'none', transition: 'all 0.2s'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-center"><div className="spinner" /></div>}

      {/* Monthly Report */}
      {!loading && tab === 'monthly' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <select className="form-control" style={{ maxWidth: 140 }} value={month} onChange={e => setMonth(e.target.value)}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <input type="number" className="form-control" style={{ maxWidth: 100 }} value={year} onChange={e => setYear(e.target.value)} min={2020} max={2030} />
            <button className="btn btn-primary btn-sm" onClick={loadMonthly}>Generate</button>
          </div>
          {monthlyData && (
            <div>
              <div className="stats-grid" style={{ marginBottom: 20 }}>
                {[
                  { l: 'Materials', v: monthlyData.totals?.material_total, c: 'blue' },
                  { l: 'Worker Wages', v: monthlyData.totals?.worker_total, c: 'green' },
                  { l: 'Other Expenses', v: monthlyData.totals?.expense_total, c: 'amber' },
                ].map(s => (
                  <div key={s.l} className="stat-card">
                    <div className={`stat-icon ${s.c}`}>💰</div>
                    <div className="stat-info"><div className="label">{s.l}</div><div className="value">{fmt(s.v || 0)}</div></div>
                  </div>
                ))}
              </div>

              <div className="charts-grid">
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">📦 Materials by Type</div></div>
                  <div className="panel-body">
                    {(monthlyData.materialSummary || []).length === 0 ? <div className="empty-state"><p>No data</p></div> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={monthlyData.materialSummary} barSize={22}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="material_type" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                          <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                          <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                          <Bar dataKey="total" fill="#3b82f6" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">👷 Workers by Profession</div></div>
                  <div className="panel-body">
                    {(monthlyData.workerSummary || []).length === 0 ? <div className="empty-state"><p>No data</p></div> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={monthlyData.workerSummary} cx="50%" cy="50%" outerRadius={80} dataKey="total" nameKey="profession">
                            {(monthlyData.workerSummary||[]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Expense Summary Table */}
              {(monthlyData.expenseSummary || []).length > 0 && (
                <div className="panel" style={{ marginTop: 20 }}>
                  <div className="panel-header"><div className="panel-title">💸 Expense Summary by Category</div></div>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead><tr><th>Expense Head</th><th>Count</th><th>Total Amount</th></tr></thead>
                      <tbody>
                        {monthlyData.expenseSummary.map(e => (
                          <tr key={e.expense_head}>
                            <td><span className="badge badge-info">{e.expense_head}</span></td>
                            <td>{e.count}</td>
                            <td style={{ fontWeight: 700 }}>₹{Number(e.total).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Daily Report */}
      {!loading && tab === 'daily' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <input type="date" className="form-control" style={{ maxWidth: 200 }} value={dailyDate} onChange={e => setDailyDate(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={loadDaily}>Generate</button>
          </div>
          {dailyData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">📦 Materials Purchased on {dailyDate}</div></div>
                <div className="table-wrapper">
                  {dailyData.materials?.length === 0 ? <div className="empty-state"><p>No materials</p></div> : (
                    <table className="data-table">
                      <thead><tr><th>Site</th><th>Material</th><th>Quantity</th><th>Unit</th><th>Rate</th><th>Total</th><th>Supplier</th></tr></thead>
                      <tbody>
                        {dailyData.materials?.map(m => (
                          <tr key={m.id}>
                            <td>{m.site_name}</td>
                            <td>{m.material_type}</td>
                            <td>{m.quantity}</td>
                            <td>{m.unit}</td>
                            <td>₹{Number(m.rate).toLocaleString('en-IN')}</td>
                            <td style={{ fontWeight: 700 }}>₹{Number(m.total_amount).toLocaleString('en-IN')}</td>
                            <td>{m.supplier_vendor || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">💸 Expenses on {dailyDate}</div></div>
                <div className="table-wrapper">
                  {dailyData.expenses?.length === 0 ? <div className="empty-state"><p>No expenses</p></div> : (
                    <table className="data-table">
                      <thead><tr><th>Site</th><th>Head</th><th>Amount</th><th>Mode</th><th>Status</th></tr></thead>
                      <tbody>
                        {dailyData.expenses?.map(e => (
                          <tr key={e.id}>
                            <td>{e.site_name}</td>
                            <td><span className="badge badge-info">{e.expense_head}</span></td>
                            <td style={{ fontWeight: 700 }}>₹{Number(e.amount).toLocaleString('en-IN')}</td>
                            <td>{e.payment_mode || '—'}</td>
                            <td><span className={`badge ${e.status === 'approved' ? 'badge-success' : e.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{e.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Site-wise Report */}
      {!loading && tab === 'sitewise' && siteData.length > 0 && (
        <div>
          <div className="panel">
            <div className="panel-header"><div className="panel-title">🏗️ Site-wise Cost Summary</div></div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Site</th><th>Status</th><th>Materials</th><th>Workers</th><th>Other Expenses</th><th>Grand Total</th></tr></thead>
                <tbody>
                  {siteData.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>🏗️ {s.name}</td>
                      <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td>₹{Number(s.material_cost).toLocaleString('en-IN')}</td>
                      <td>₹{Number(s.worker_cost).toLocaleString('en-IN')}</td>
                      <td>₹{Number(s.expense_total).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{Number(s.grand_total).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel" style={{ marginTop: 20 }}>
            <div className="panel-header"><div className="panel-title">📊 Site Cost Comparison</div></div>
            <div className="panel-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={siteData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="material_cost" name="Materials" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="worker_cost" name="Workers" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="expense_total" name="Expenses" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Total Expenses Report */}
      {!loading && tab === 'total' && totalData && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            {[
              { l: 'Material Cost', v: totalData.summary?.material_cost, c: 'blue' },
              { l: 'Worker Cost', v: totalData.summary?.worker_cost, c: 'green' },
              { l: 'Other Expenses', v: totalData.summary?.other_expenses, c: 'amber' },
              { l: 'Grand Total', v: totalData.summary?.grand_total, c: 'purple' },
            ].map(s => (
              <div key={s.l} className="stat-card">
                <div className={`stat-icon ${s.c}`}>💰</div>
                <div className="stat-info"><div className="label">{s.l}</div><div className="value" style={{ fontSize: 18 }}>{fmt(s.v || 0)}</div></div>
              </div>
            ))}
          </div>
          <div className="charts-grid">
            <div className="panel">
              <div className="panel-header"><div className="panel-title">💸 Expenses by Category</div></div>
              <div className="panel-body">
                {(totalData.byCategory||[]).length === 0 ? <div className="empty-state"><p>No data</p></div> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={totalData.byCategory} cx="50%" cy="50%" outerRadius={80} dataKey="total" nameKey="category">
                        {(totalData.byCategory||[]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="panel">
              <div className="panel-header"><div className="panel-title">🏗️ Expenses by Site</div></div>
              <div className="panel-body">
                {(totalData.bySite||[]).length === 0 ? <div className="empty-state"><p>No data</p></div> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={totalData.bySite} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                      <Bar dataKey="expense_total" name="Expenses" fill="#f59e0b" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
