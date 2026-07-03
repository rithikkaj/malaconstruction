import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, toggleAdmin, resetAdminPassword, getSites } from '../../api/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, KeyRound } from 'lucide-react';

const EMPTY_FORM = { name: '', email: '', password: '', site_id: '' };

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [resetId, setResetId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getAdmins(), getSites()])
      .then(([a, s]) => { setAdmins(a.data); setSites(s.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(EMPTY_FORM); setModal('add'); };
  const openEdit = (a) => { setForm({ name: a.name, email: a.email, password: '', site_id: a.site_id || '' }); setEditId(a.id); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditId(null); setResetId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') {
        await createAdmin({ name: form.name, email: form.email, password: form.password, site_id: form.site_id || null });
        toast.success('Admin created!');
      } else {
        await updateAdmin(editId, { name: form.name, email: form.email, site_id: form.site_id || null });
        toast.success('Admin updated!');
      }
      closeModal(); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving admin');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete admin "${name}"?`)) return;
    try { await deleteAdmin(id); toast.success('Admin deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleToggle = async (id) => {
    try { await toggleAdmin(id); load(); }
    catch { toast.error('Toggle failed'); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setSaving(true);
    try {
      await resetAdminPassword(resetId, { newPassword });
      toast.success('Password reset!');
      closeModal(); setNewPassword('');
    } catch { toast.error('Reset failed'); }
    finally { setSaving(false); }
  };

  return (
    <Layout title="Site Admins" subtitle="Manage admin accounts for each site">
      <div className="page-header">
        <div>
          <h2>Site Admins ({filtered.length})</h2>
          <p>Each admin manages one site</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="add-admin-btn"><Plus size={16} /> Add Admin</button>
      </div>

      <div className="filters-row">
        <input className="form-control search-input" placeholder="🔍 Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="panel">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
            <div className="empty-state"><p>No admins found.</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Assigned Site</th><th>Status</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>👤 {a.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.email}</td>
                    <td>
                      {a.site_name
                        ? <span className="badge badge-info">🏗️ {a.site_name}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${a.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-icon btn-outline" title="Edit" onClick={() => openEdit(a)}><Pencil size={13} /></button>
                        <button className="btn btn-icon btn-outline" title="Reset Password" onClick={() => { setResetId(a.id); setModal('reset'); }}><KeyRound size={13} /></button>
                        <button className="btn btn-icon btn-outline" title={a.is_active ? 'Deactivate' : 'Activate'} onClick={() => handleToggle(a.id)}>
                          {a.is_active ? <ToggleRight size={13} style={{ color: 'var(--success)' }} /> : <ToggleLeft size={13} />}
                        </button>
                        <button className="btn btn-icon btn-danger" title="Delete" onClick={() => handleDelete(a.id, a.name)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? '➕ Add Site Admin' : '✏️ Edit Admin'} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            {modal === 'add' && (
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Min 6 characters" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Assign Site</label>
              <select className="form-control" value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })}>
                <option value="">— No site assigned —</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Admin'}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'reset' && (
        <Modal title="🔑 Reset Password" onClose={closeModal}>
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" required />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Resetting...' : 'Reset Password'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
