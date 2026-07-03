import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { getWorkers, createWorker, updateWorker, deleteWorker } from '../../api/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const PROFESSIONS = ['Construction Laborer','Mason / Bricklayer','Carpenter','Electrician','Plumber','Painter','Tile Worker','Welder','Steel Fixer','Helper','Other'];
const EMPTY = { name: '', profession: '', daily_wage: '', days_worked: '', work_period_start: '', work_period_end: '' };

export default function SiteWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [profFilter, setProfFilter] = useState('');

  const load = () => {
    setLoading(true);
    getWorkers().then(r => setWorkers(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) &&
    (profFilter === '' || w.profession === profFilter)
  );

  const openAdd = () => { setForm({ ...EMPTY, work_period_start: new Date().toISOString().split('T')[0] }); setModal('add'); };
  const openEdit = (w) => {
    setForm({ name: w.name, profession: w.profession, daily_wage: w.daily_wage, days_worked: w.days_worked, work_period_start: w.work_period_start?.split('T')[0] || '', work_period_end: w.work_period_end?.split('T')[0] || '' });
    setEditId(w.id); setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'add') { await createWorker(form); toast.success('Worker added!'); }
      else { await updateWorker(editId, form); toast.success('Worker updated!'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete worker "${name}"?`)) return;
    try { await deleteWorker(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const totalWages = filtered.reduce((s, w) => s + parseFloat(w.total_amount || 0), 0);

  return (
    <Layout title="Worker Management" subtitle="Track all workers, professions and wages for your site">
      <div className="page-header">
        <div>
          <h2>Workers ({filtered.length})</h2>
          <p>Total Wages: ₹{totalWages.toLocaleString('en-IN')}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="add-worker-btn"><Plus size={16} /> Add Worker</button>
      </div>

      <div className="filters-row">
        <input className="form-control search-input" placeholder="🔍 Search worker name..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-control" style={{ maxWidth: 220 }} value={profFilter} onChange={e => setProfFilter(e.target.value)}>
          <option value="">All Professions</option>
          {PROFESSIONS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="panel">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
            <div className="empty-state"><p>No workers found. Add your first worker!</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Profession</th><th>Daily Wage</th><th>Days Worked</th><th>Total Amount</th><th>Work Period</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((w, i) => (
                  <tr key={w.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>👷 {w.name}</td>
                    <td><span className="badge badge-muted">{w.profession}</span></td>
                    <td>₹{Number(w.daily_wage).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>{w.days_worked} days</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: 15 }}>₹{Number(w.total_amount).toLocaleString('en-IN')}</td>
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
        <Modal title={modal === 'add' ? '➕ Add Worker' : '✏️ Edit Worker'} onClose={() => setModal(null)} size="lg">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Worker Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ravi Kumar" required />
              </div>
              <div className="form-group">
                <label className="form-label">Profession *</label>
                <select className="form-control" value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} required>
                  <option value="">— Select —</option>
                  {PROFESSIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Daily Wage (₹) *</label>
                <input type="number" className="form-control" value={form.daily_wage} onChange={e => setForm({ ...form, daily_wage: e.target.value })} placeholder="e.g. 900" required />
              </div>
              <div className="form-group">
                <label className="form-label">Days Worked *</label>
                <input type="number" className="form-control" value={form.days_worked} onChange={e => setForm({ ...form, days_worked: e.target.value })} placeholder="e.g. 15" required />
              </div>
            </div>
            {form.daily_wage && form.days_worked && (
              <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, color: 'var(--success)', fontWeight: 700, fontSize: 14 }}>
                💰 Total Amount: ₹{(parseFloat(form.daily_wage || 0) * parseInt(form.days_worked || 0)).toLocaleString('en-IN')}
              </div>
            )}
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
              <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Worker'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
