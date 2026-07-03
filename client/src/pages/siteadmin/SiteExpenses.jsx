import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { getExpenses, createExpense, updateExpense } from '../../api/api';
import toast from 'react-hot-toast';
import { Plus, Pencil } from 'lucide-react';

const EXPENSE_HEADS = ['Transport','Machinery','Fuel','Accommodation','Food','Equipment','Tools','Maintenance','Utilities','Miscellaneous'];
const PAYMENT_MODES = ['Cash','Bank Transfer','UPI','Cheque','Other'];
const EMPTY = { expense_head: '', description: '', amount: '', date: '', payment_mode: '', receipt_bill: '' };

export default function SiteExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    getExpenses().then(r => setExpenses(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = expenses.filter(e => statusFilter === '' || e.status === statusFilter);
  const total = filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const openAdd = () => { setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] }); setModal('add'); };
  const openEdit = (e) => {
    if (e.status !== 'pending') return toast.error('Only pending expenses can be edited.');
    setForm({ expense_head: e.expense_head, description: e.description || '', amount: e.amount, date: e.date?.split('T')[0] || '', payment_mode: e.payment_mode || '', receipt_bill: e.receipt_bill || '' });
    setEditId(e.id); setModal('edit');
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault(); setSaving(true);
    try {
      if (modal === 'add') { await createExpense(form); toast.success('Expense submitted for approval!'); }
      else { await updateExpense(editId, form); toast.success('Expense updated!'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  return (
    <Layout title="Other Expenses" subtitle="Submit and track site expenses for Super Admin approval">
      <div className="page-header">
        <div>
          <h2>Expenses ({filtered.length})</h2>
          <p>Total: ₹{total.toLocaleString('en-IN')} · {expenses.filter(e => e.status === 'pending').length} pending</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="add-expense-btn"><Plus size={16} /> Add Expense</button>
      </div>

      <div className="filters-row">
        <select className="form-control" style={{ maxWidth: 200 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div style={{ background: 'var(--info-bg)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--info)' }}>
        ℹ️ All expenses are submitted in <strong>Pending</strong> status and require Super Admin approval. Approved expenses count toward site costs.
      </div>

      <div className="panel">
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
            <div className="empty-state"><p>No expenses found. Add your first expense!</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Expense Head</th><th>Description</th><th>Amount</th><th>Date</th><th>Mode</th><th>Status</th><th>Edit</th></tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td><span className="badge badge-info">{e.expense_head}</span></td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description || '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(e.amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: 12 }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: 12 }}>{e.payment_mode || '—'}</td>
                    <td>
                      <span className={`badge ${e.status === 'approved' ? 'badge-success' : e.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {e.status === 'approved' ? '✅ Approved' : e.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>
                      {e.status === 'pending' && (
                        <button className="btn btn-icon btn-outline" onClick={() => openEdit(e)}><Pencil size={13} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <Modal title={modal === 'add' ? '➕ Add Expense' : '✏️ Edit Expense'} onClose={() => setModal(null)} size="lg">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Expense Head *</label>
                <select className="form-control" value={form.expense_head} onChange={e => setForm({ ...form, expense_head: e.target.value })} required>
                  <option value="">— Select Head —</option>
                  {EXPENSE_HEADS.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input type="number" step="0.01" className="form-control" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 5000" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the expense..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-control" value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
                  <option value="">— Select —</option>
                  {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Receipt / Bill Reference</label>
              <input className="form-control" value={form.receipt_bill} onChange={e => setForm({ ...form, receipt_bill: e.target.value })} placeholder="e.g. Bill No. 2024-001" />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting...' : modal === 'add' ? 'Submit Expense' : 'Update Expense'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
