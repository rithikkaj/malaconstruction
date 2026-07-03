import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { getExpenses, updateExpense, deleteExpense, approveExpense, rejectExpense, getSites } from '../../api/api';
import toast from 'react-hot-toast';
import { Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';

const EXPENSE_HEADS = ['Transport','Machinery','Fuel','Accommodation','Food','Equipment','Tools','Maintenance','Utilities','Miscellaneous'];
const PAYMENT_MODES = ['Cash','Bank Transfer','UPI','Cheque','Other'];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ site_id: '', status: '' });

  const load = (f = filters) => {
    setLoading(true);
    const params = {};
    if (f.site_id) params.site_id = f.site_id;
    if (f.status) params.status = f.status;
    getExpenses(params).then(r => setExpenses(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { getSites().then(r => setSites(r.data)); load(); }, []);

  const openEdit = (e) => {
    setForm({
      expense_head: e.expense_head, description: e.description || '',
      amount: e.amount, date: e.date?.split('T')[0] || '',
      payment_mode: e.payment_mode || '', receipt_bill: e.receipt_bill || '',
    });
    setEditId(e.id); setModal(true);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault(); setSaving(true);
    try {
      await updateExpense(editId, form);
      toast.success('Expense updated!'); setModal(false); load();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await deleteExpense(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const handleApprove = async (id) => {
    try { await approveExpense(id); toast.success('Approved!'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleReject = async (id) => {
    try { await rejectExpense(id); toast.success('Rejected'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleFilter = (key, val) => {
    const newF = { ...filters, [key]: val };
    setFilters(newF); load(newF);
  };

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const pending = expenses.filter(e => e.status === 'pending').length;

  return (
    <Layout title="Expenses" subtitle="Review, approve and manage all site expenses">
      <div className="page-header">
        <div>
          <h2>All Expenses ({expenses.length})</h2>
          <p>Total: ₹{total.toLocaleString('en-IN')} · {pending} pending approval</p>
        </div>
      </div>

      <div className="filters-row">
        <select className="form-control" style={{ maxWidth: 200 }} value={filters.site_id} onChange={e => handleFilter('site_id', e.target.value)}>
          <option value="">All Sites</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="form-control" style={{ maxWidth: 160 }} value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="panel">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : expenses.length === 0 ? (
            <div className="empty-state"><p>No expenses found.</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Site</th><th>Head</th><th>Description</th><th>Amount</th><th>Date</th><th>Mode</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontSize: 12 }}>{e.site_name}</td>
                    <td><span className="badge badge-info">{e.expense_head}</span></td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description || '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(e.amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: 12 }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: 12 }}>{e.payment_mode || '—'}</td>
                    <td>
                      <span className={`badge ${e.status === 'approved' ? 'badge-success' : e.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {e.status === 'pending' && (<>
                          <button className="btn btn-icon btn-success" title="Approve" onClick={() => handleApprove(e.id)}><CheckCircle size={13} /></button>
                          <button className="btn btn-icon btn-danger" title="Reject" onClick={() => handleReject(e.id)}><XCircle size={13} /></button>
                        </>)}
                        <button className="btn btn-icon btn-outline" title="Edit" onClick={() => openEdit(e)}><Pencil size={13} /></button>
                        <button className="btn btn-icon btn-danger" title="Delete" onClick={() => handleDelete(e.id)}><Trash2 size={13} /></button>
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
        <Modal title="✏️ Edit Expense" onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Expense Head *</label>
                <select className="form-control" value={form.expense_head} onChange={e => setForm({ ...form, expense_head: e.target.value })} required>
                  {EXPENSE_HEADS.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input type="number" className="form-control" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-control" value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
                  <option value="">—</option>
                  {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Receipt / Bill Reference</label>
              <input className="form-control" value={form.receipt_bill} onChange={e => setForm({ ...form, receipt_bill: e.target.value })} placeholder="e.g. INV-2024-001" />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
