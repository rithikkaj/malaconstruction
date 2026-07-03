import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { getSites, createSite, updateSite, deleteSite, toggleSite } from '../../api/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';

const EMPTY = { name: '', location: '' };

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getSites().then(r => setSites(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (s) => { setForm({ name: s.name, location: s.location || '' }); setEditId(s.id); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') {
        await createSite(form);
        toast.success('Site created!');
      } else {
        await updateSite(editId, { ...form, is_active: 1 });
        toast.success('Site updated!');
      }
      closeModal(); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving site');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete site "${name}"? This will remove all associated data.`)) return;
    try {
      await deleteSite(id);
      toast.success('Site deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleSite(id);
      load();
    } catch { toast.error('Toggle failed'); }
  };

  return (
    <Layout title="Manage Sites" subtitle="Add, edit and activate/deactivate construction sites">
      <div className="page-header">
        <div>
          <h2>Sites ({sites.length})</h2>
          <p>{sites.filter(s => s.is_active).length} active sites</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="add-site-btn">
          <Plus size={16} /> Add Site
        </button>
      </div>

      <div className="panel">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : sites.length === 0 ? (
            <div className="empty-state">
              <Building2 size={48} />
              <p>No sites found. Add your first site!</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Site Name</th>
                  <th>Location</th>
                  <th>Admins</th>
                  <th>Workers</th>
                  <th>Total Expenses</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>🏗️ {s.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.location || '—'}</td>
                    <td>{s.admin_count || 0}</td>
                    <td>{s.worker_count || 0}</td>
                    <td>₹{Number(s.total_expenses || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-icon btn-outline" title="Edit" onClick={() => openEdit(s)}><Pencil size={13} /></button>
                        <button className="btn btn-icon btn-outline" title={s.is_active ? 'Deactivate' : 'Activate'} onClick={() => handleToggle(s.id)}>
                          {s.is_active ? <ToggleRight size={13} style={{ color: 'var(--success)' }} /> : <ToggleLeft size={13} />}
                        </button>
                        <button className="btn btn-icon btn-danger" title="Delete" onClick={() => handleDelete(s.id, s.name)}><Trash2 size={13} /></button>
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
        <Modal title={modal === 'add' ? '➕ Add New Site' : '✏️ Edit Site'} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Site Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Site A – Chennai" required />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-control" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Chennai, Tamil Nadu" />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Site'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
