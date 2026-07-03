import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { getWorkers, updateWorker, deleteWorker, getSites } from '../../api/api';
import toast from 'react-hot-toast';
import { Pencil, Trash2 } from 'lucide-react';

const PROFESSIONS = ['Construction Laborer','Mason / Bricklayer','Carpenter','Electrician','Plumber','Painter','Tile Worker','Welder','Steel Fixer','Helper','Other'];

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [siteFilter, setSiteFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = (sf = siteFilter) => {
    setLoading(true);
    getWorkers(sf ? { site_id: sf } : {})
      .then(r => setWorkers(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => {
    getSites().then(r => setSites(r.data));
    load();
  }, []);

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.profession.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (w) => {
    setForm({
      name: w.name, profession: w.profession,
      daily_wage: w.daily_wage, days_worked: w.days_worked,
      work_period_start: w.work_period_start?.split('T')[0] || '',
      work_period_end: w.work_period_end?.split('T')[0] || '',
    });
    setEditId(w.id); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await updateWorker(editId, form);
      toast.success('Worker updated!');
      setModal(false); load();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete worker "${name}"?`)) return;
    try { await deleteWorker(id); toast.success('Worker deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const handleSiteFilter = (v) => {
    setSiteFilter(v);
    setLoading(true);
    getWorkers(v ? { site_id: v } : {}).then(r => setWorkers(r.data)).finally(() => setLoading(false));
  };

  const totalPayments = filtered.reduce((s, w) => s + parseFloat(w.total_amount || 0), 0);

  return (
    <Layout title="Workers" subtitle="View and manage all workers across sites">
      <div className="page-header">
        <div>
          <h2>All Workers ({filtered.length})</h2>
          <p>Total Payments: ₹{totalPayments.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="filters-row">
        <input className="form-control search-input" placeholder="🔍 Search name / profession..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-control" style={{ maxWidth: 200 }} value={siteFilter} onChange={e => handleSiteFilter(e.target.value)}>
          <option value="">All Sites</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="panel">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
            <div className="empty-state"><p>No workers found.</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Profession</th><th>Site</th><th>Daily Wage</th><th>Days</th><th>Total Amount</th><th>Work Period</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((w, i) => (
                  <tr key={w.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>👷 {w.name}</td>
                    <td><span className="badge badge-muted">{w.profession}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{w.site_name}</td>
                    <td>₹{Number(w.daily_wage).toLocaleString('en-IN')}</td>
                    <td>{w.days_worked}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{Number(w.total_amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {w.work_period_start ? `${new Date(w.work_period_start).toLocaleDateString('en-IN')} → ${w.work_period_end ? new Date(w.work_period_end).toLocaleDateString('en-IN') : '…'}` : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-icon btn-outline" onClick={() => openEdit(w)}><Pencil size={13} /></button>
                        <button className="btn btn-icon btn-danger" onClick={() => handleDelete(w.id, w.name)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <Modal title="✏️ Edit Worker" onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Profession *</label>
                <select className="form-control" value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} required>
                  {PROFESSIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Daily Wage (₹) *</label>
                <input type="number" className="form-control" value={form.daily_wage} onChange={e => setForm({ ...form, daily_wage: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Days Worked *</label>
                <input type="number" className="form-control" value={form.days_worked} onChange={e => setForm({ ...form, days_worked: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Work Period Start</label>
                <input type="date" className="form-control" value={form.work_period_start} onChange={e => setForm({ ...form, work_period_start: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Work Period End</label>
                <input type="date" className="form-control" value={form.work_period_end} onChange={e => setForm({ ...form, work_period_end: e.target.value })} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update Worker'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
