import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StatusBadge, ConditionBadge, DepBar, Money, Loading, ConfirmModal } from '../components/Shared'
import { useToast } from '../components/Toast'
import { api } from '../api/client'

export default function AssetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [data, setData] = useState(null)
  const [showDelete, setShowDelete] = useState(false)
  const [maintForm, setMaintForm] = useState({ date: '', description: '', cost: '', performed_by: '' })
  const [submitting, setSubmitting] = useState(false)

  const [editingLogId, setEditingLogId] = useState(null)
  const [editForm, setEditForm] = useState({ date: '', description: '', cost: '', performed_by: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteLogId, setDeleteLogId] = useState(null)

  const load = () => api.getAsset(id).then(setData).catch(console.error)
  useEffect(() => { load() }, [id])

  async function handleDelete() {
    try {
      await api.deleteAsset(id)
      toast('Asset deleted.', 'warning')
      navigate('/assets')
    } catch (e) { toast(e.message, 'danger') }
  }

  async function handleMaintenance(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.addMaintenance(id, maintForm)
      toast('Maintenance record added.', 'success')
      setMaintForm({ date: '', description: '', cost: '', performed_by: '' })
      load()
    } catch (e) { toast(e.message, 'danger') }
    finally { setSubmitting(false) }
  }

  function startEdit(log) {
    setEditingLogId(log.id)
    setEditForm({ date: log.date, description: log.description, cost: log.cost ?? '', performed_by: log.performed_by ?? '' })
  }
  function cancelEdit() {
    setEditingLogId(null)
    setEditForm({ date: '', description: '', cost: '', performed_by: '' })
  }
  async function handleSaveEdit(logId) {
    setSavingEdit(true)
    try {
      await api.updateMaintenance(logId, editForm)
      toast('Maintenance record updated.', 'success')
      setEditingLogId(null)
      load()
    } catch (e) { toast(e.message, 'danger') }
    finally { setSavingEdit(false) }
  }
  async function handleDeleteLog() {
    try {
      await api.deleteMaintenance(deleteLogId)
      toast('Maintenance record deleted.', 'warning')
      setDeleteLogId(null)
      load()
    } catch (e) { toast(e.message, 'danger') }
  }

  if (!data) return <Layout title="Asset Detail"><Loading /></Layout>
  const { asset, logs } = data
  const pct = asset.depreciation_pct

  return (
    <Layout title="Asset Detail">
      {showDelete && (
        <ConfirmModal title="Delete Asset"
          message={`Are you sure you want to delete "${asset.name}"? This cannot be undone.`}
          danger onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      )}
      {deleteLogId && (
        <ConfirmModal title="Delete Maintenance Record"
          message="Are you sure you want to delete this maintenance record? This cannot be undone."
          danger onConfirm={handleDeleteLog} onCancel={() => setDeleteLogId(null)} />
      )}

      <div className="page-header">
        <div>
          <h1>{asset.name}</h1>
          <p className="tag-number">{asset.tag_number}</p>
        </div>
        <div className="flex gap-8">
          <Link to={`/assets/${id}/edit`} className="btn btn-primary">✎ Edit</Link>
          <button className="btn btn-secondary" onClick={() => window.print()}>⎙ Print</button>
          <Link to="/assets" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-header"><span className="card-title">Asset Details</span></div>
          <div style={{ padding: 0 }}>
            <table>
              <tbody>
                {[
                  ['Tag Number', <span className="tag-number">{asset.tag_number}</span>],
                  ['Category', asset.category],
                  ['Manufacturer', asset.manufacturer || '—'],
                  ['Brand / Model', [asset.brand, asset.model].filter(Boolean).join(' ') || '—'],
                  ['Serial Number', asset.serial_number || '—'],
                  ['Department', asset.dept_name],
                  ['Assigned To', asset.assigned_to || '—'],
                  ['Location', asset.location || '—'],
                  ['In-Service Date', asset.date_added || '—'],
                  ['Purchase Date', asset.purchase_date],
                  ['Status', <StatusBadge status={asset.status} />],
                  ['Condition', <ConditionBadge condition={asset.condition} />],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ width: '38%', color: 'var(--gray-400)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {label}
                    </td>
                    <td>{value}</td>
                  </tr>
                ))}
                {asset.description && (
                  <tr>
                    <td style={{ color: 'var(--gray-400)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Description</td>
                    <td style={{ fontSize: 13 }}>{asset.description}</td>
                  </tr>
                )}
                {asset.notes && (
                  <tr>
                    <td style={{ color: 'var(--gray-400)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Notes</td>
                    <td style={{ fontSize: 13 }}>{asset.notes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Financial Summary</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ background: 'var(--green-light)', borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--green-dark)', fontWeight: 600, marginBottom: 6 }}>Purchase Cost</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green-dark)', fontFamily: 'IBM Plex Mono' }}>
                    <Money value={asset.purchase_cost} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>Purchased: {asset.purchase_date}</div>
                  <div style={{ fontSize: 11, color: 'var(--green)' }}>In Service: {asset.date_added || '—'}</div>
                </div>
                <div style={{ background: 'var(--blue-light)', borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--blue)', fontWeight: 600, marginBottom: 6 }}>Net Book Value</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue)', fontFamily: 'IBM Plex Mono' }}>
                    <Money value={asset.net_book_value} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4 }}>As at today</div>
                </div>
              </div>

              <div style={{ background: 'var(--gray-100)', borderRadius: 6, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 8, fontWeight: 600 }}>Depreciation Progress</div>
                <DepBar pct={pct} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8 }}>
                  <span style={{ color: 'var(--gray-600)' }}>Accumulated: <strong><Money value={asset.accumulated_depreciation} /></strong></span>
                  <span style={{ fontWeight: 700, color: pct > 80 ? 'var(--red)' : pct > 40 ? 'var(--gold)' : 'var(--green)' }}>{pct}%</span>
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.9 }}>
                <div>Method: <strong style={{ color: 'var(--gray-600)' }}>Straight-Line</strong></div>
                <div>Useful life: <strong style={{ color: 'var(--gray-600)' }}>{asset.useful_life_years} years</strong></div>
                <div>Annual depreciation: <strong style={{ color: 'var(--gray-600)' }}><Money value={asset.annual_depreciation} /></strong></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-danger" onClick={() => setShowDelete(true)}>🗑 Delete Asset</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Maintenance History</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Description</th><th>Performed By</th><th>Cost (₦)</th>
                <th style={{ width: 120, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>No maintenance records yet.</td></tr>
              ) : logs.map(log => {
                const isEditing = editingLogId === log.id
                return isEditing ? (
                  <tr key={log.id} style={{ background: 'var(--blue-light)' }}>
                    <td><input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', fontSize: 13 }} /></td>
                    <td><input type="text" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={{ width: '100%', fontSize: 13 }} placeholder="Description" /></td>
                    <td><input type="text" value={editForm.performed_by} onChange={e => setEditForm(f => ({ ...f, performed_by: e.target.value }))} style={{ width: '100%', fontSize: 13 }} placeholder="Technician / Vendor" /></td>
                    <td><input type="number" min="0" step="0.01" value={editForm.cost} onChange={e => setEditForm(f => ({ ...f, cost: e.target.value }))} style={{ width: '100%', fontSize: 13 }} placeholder="0" /></td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(log.id)} disabled={savingEdit} style={{ marginRight: 6 }}>{savingEdit ? '…' : '✓ Save'}</button>
                      <button className="btn btn-secondary btn-sm" onClick={cancelEdit} disabled={savingEdit}>✕</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={log.id}>
                    <td className="tag-number">{log.date}</td>
                    <td>{log.description}</td>
                    <td>{log.performed_by || '—'}</td>
                    <td>{log.cost ? <Money value={log.cost} /> : '—'}</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => startEdit(log)} style={{ marginRight: 6 }} title="Edit">✎</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteLogId(log.id)} title="Delete">🗑</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="card-body" style={{ borderTop: '1px solid var(--gray-200)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--gray-600)' }}>Add Maintenance Record</p>
          <form onSubmit={handleMaintenance}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 200px 160px', gap: 12 }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" required value={maintForm.date} onChange={e => setMaintForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" required placeholder="What was done?" value={maintForm.description} onChange={e => setMaintForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Performed By</label>
                <input type="text" placeholder="Technician / Vendor" value={maintForm.performed_by} onChange={e => setMaintForm(f => ({ ...f, performed_by: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Cost (₦)</label>
                <input type="number" min="0" step="0.01" placeholder="0" value={maintForm.cost} onChange={e => setMaintForm(f => ({ ...f, cost: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm mt-16" disabled={submitting}>
              {submitting ? 'Saving…' : '+ Add Record'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
