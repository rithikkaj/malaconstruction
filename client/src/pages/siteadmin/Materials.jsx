import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../../api/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const MATERIAL_TYPES = ['Cement','Steel','Sand','Bricks','Aggregates','Paint','Pipes','Tiles','Timber','Gravel','Other Materials'];
const UNITS = ['Bags','Tonnes','KG','Cubic Meters','Liters','Pieces','Meters','Bundles','Loads'];
const EMPTY = { material_type: '', quantity: '', unit: '', rate: '', date: '', supplier_vendor: '', description: '' };

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    getMaterials().then(r => setMaterials(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = materials.filter(m =>
    m.material_type.toLowerCase().includes(search.toLowerCase()) ||
    (m.supplier_vendor || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] }); setModal('add'); };
  const openEdit = (m) => {
    setForm({ material_type: m.material_type, quantity: m.quantity, unit: m.unit || '', rate: m.rate, date: m.date?.split('T')[0] || '', supplier_vendor: m.supplier_vendor || '', description: m.description || '' });
    setEditId(m.id); setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'add') { await createMaterial(form); toast.success('Material added!'); }
      else { await updateMaterial(editId, form); toast.success('Material updated!'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this material entry?')) return;
    try { await deleteMaterial(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const total = filtered.reduce((s, m) => s + parseFloat(m.total_amount || 0), 0);

  return (
    <Layout title="Material / Product Entry" subtitle="Track all purchased materials for your site">
      <div className="page-header">
        <div>
          <h2>Materials ({filtered.length})</h2>
          <p>Total Cost: ₹{total.toLocaleString('en-IN')}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="add-material-btn"><Plus size={16} /> Add Material</button>
      </div>

      <div className="filters-row">
        <input className="form-control search-input" placeholder="🔍 Search material type or supplier..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="panel">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
            <div className="empty-state"><p>No materials added yet. Click "Add Material" to start.</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Material</th><th>Quantity</th><th>Unit</th><th>Rate (₹)</th><th>Total (₹)</th><th>Date</th><th>Supplier</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>📦 {m.material_type}</td>
                    <td>{m.quantity}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{m.unit || '—'}</td>
                    <td>₹{Number(m.rate).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(m.total_amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: 12 }}>{new Date(m.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{m.supplier_vendor || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-icon btn-outline" onClick={() => openEdit(m)}><Pencil size={13} /></button>
                        <button className="btn btn-icon btn-danger" onClick={() => handleDelete(m.id)}><Trash2 size={13} /></button>
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
        <Modal title={modal === 'add' ? '➕ Add Material' : '✏️ Edit Material'} onClose={() => setModal(null)} size="lg">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Material Type *</label>
                <select className="form-control" value={form.material_type} onChange={e => setForm({ ...form, material_type: e.target.value })} required>
                  <option value="">— Select —</option>
                  {MATERIAL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input type="number" step="0.01" className="form-control" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  <option value="">—</option>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rate per Unit (₹) *</label>
                <input type="number" step="0.01" className="form-control" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} required />
              </div>
            </div>
            {form.quantity && form.rate && (
              <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>
                💰 Total Amount: ₹{(parseFloat(form.quantity || 0) * parseFloat(form.rate || 0)).toLocaleString('en-IN')}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Supplier / Vendor</label>
              <input className="form-control" value={form.supplier_vendor} onChange={e => setForm({ ...form, supplier_vendor: e.target.value })} placeholder="e.g. ABC Cement Traders" />
            </div>
            <div className="form-group">
              <label className="form-label">Description / Notes</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes..." />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Material'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
