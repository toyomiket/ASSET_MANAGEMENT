import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Loading, ConfirmModal, StatusBadge, Money, DepPct } from '../components/Shared'
import { useToast } from '../components/Toast'
import { api } from '../api/client'

export default function Departments() {
  const toast = useToast()
  const [departments, setDepartments] = useState(null)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Department assets panel
  const [selectedDept, setSelectedDept] = useState(null)
  const [deptAssets, setDeptAssets] = useState(null)
  const [loadingAssets, setLoadingAssets] = useState(false)

  const load = () => api.departments().then(d => setDepartments(d.departments))
  useEffect(() => { load() }, [])

  async function handleViewAssets(dept) {
    setSelectedDept(dept)
    setDeptAssets(null)
    setLoadingAssets(true)
    try {
      const data = await api.getDepartmentAssets(dept.id)
      setDeptAssets(data.assets)
    } catch (e) {
      toast(e.message, 'danger')
    } finally {
      setLoadingAssets(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSubmitting(true)
    try {
      await api.createDepartment(newName.trim())
      toast(`Department "${newName}" added.`, 'success')
      setNewName('')
      load()
    } catch (e) {
      toast(e.message, 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRename(id) {
    if (!editName.trim()) return
    try {
      await api.updateDepartment(id, editName.trim())
      toast('Department renamed.', 'success')
      setEditId(null)
      load()
    } catch (e) {
      toast(e.message, 'danger')
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteDepartment(id)
      toast('Department deleted.', 'warning')
      setDeleteTarget(null)
      if (selectedDept?.id === id) setSelectedDept(null)
      load()
    } catch (e) {
      toast(e.message, 'danger')
      setDeleteTarget(null)
    }
  }

  return (
    <Layout title="Departments">
      {deleteTarget && (
        <ConfirmModal
          title="Delete Department"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          danger
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h1>Departments</h1>
          <p>Click a department to view its assets</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDept ? '1fr 1.6fr' : '1fr 380px', gap: 20 }}>

        {/* ── Left: department list + add form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">All Departments</span>
              <span className="text-muted">{departments ? `${departments.length} total` : ''}</span>
            </div>
            {!departments ? <Loading /> : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Department Name</th><th>Assets</th><th style={{ width: 200 }}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {departments.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>
                          No departments yet.
                        </td>
                      </tr>
                    ) : departments.map((d, i) => (
                      <tr key={d.id} style={{ background: selectedDept?.id === d.id ? 'var(--green-light)' : '' }}>
                        <td className="tag-number">{i + 1}</td>
                        <td>
                          {editId === d.id ? (
                            <input
                              autoFocus
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRename(d.id)
                                if (e.key === 'Escape') setEditId(null)
                              }}
                              style={{ padding: '5px 10px', border: '1px solid var(--green)', borderRadius: 6, fontSize: 13, width: 160 }}
                            />
                          ) : (
                            <button
                              onClick={() => handleViewAssets(d)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: selectedDept?.id === d.id ? 'var(--green)' : 'var(--gray-800)', fontSize: 14, padding: 0 }}
                            >
                              {d.name}
                            </button>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-green">{d.asset_count}</span>
                        </td>
                        <td>
                          {editId === d.id ? (
                            <div className="flex gap-8">
                              <button className="btn btn-primary btn-sm" onClick={() => handleRename(d.id)}>Save</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                            </div>
                          ) : (
                            <div className="flex gap-8">
                              <button className="btn btn-secondary btn-sm" onClick={() => { setEditId(d.id); setEditName(d.name) }}>
                                ✎ Rename
                              </button>
                              {d.asset_count === 0 ? (
                                <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(d)}>Delete</button>
                              ) : (
                                <button className="btn btn-secondary btn-sm" onClick={() => handleViewAssets(d)}>
                                  View Assets
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ alignSelf: 'start' }}>
            <div className="card-header"><span className="card-title">Add Department</span></div>
            <div className="card-body">
              <form onSubmit={handleAdd}>
                <div className="form-group mb-16">
                  <label>Department Name</label>
                  <input
                    type="text" required
                    placeholder="e.g. Procurement Department"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding…' : '＋ Add Department'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Right: department assets panel ── */}
        <div className="card" style={{ alignSelf: 'start' }}>
          {!selectedDept ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>▤</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No department selected</div>
              <div style={{ fontSize: 13 }}>Click a department name to view its assets</div>
            </div>
          ) : (
            <>
              <div className="card-header">
                <div>
                  <span className="card-title">{selectedDept.name}</span>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                    {deptAssets ? `${deptAssets.length} asset(s)` : ''}
                  </div>
                </div>
                <div className="flex gap-8">
                  <Link
                    to={`/assets?department=${selectedDept.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    View All →
                  </Link>
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDept(null)}>✕</button>
                </div>
              </div>

              {loadingAssets ? <Loading /> : !deptAssets ? null : deptAssets.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                  No assets in this department yet.{' '}
                  <Link to="/assets/new" style={{ color: 'var(--green)' }}>Add one →</Link>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tag No.</th>
                        <th>Asset Name</th>
                        <th>Cost (₦)</th>
                        <th>NBV (₦)</th>
                        <th>Dep%</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptAssets.map(a => (
                        <tr key={a.id}>
                          <td><span className="tag-number">{a.tag_number}</span></td>
                          <td>
                            <Link to={`/assets/${a.id}`} style={{ color: 'var(--green)', fontWeight: 500, textDecoration: 'none', fontSize: 13 }}>
                              {a.name}
                            </Link>
                            {a.brand && <div className="text-muted">{a.brand}{a.model ? ` ${a.model}` : ''}</div>}
                          </td>
                          <td><Money value={a.purchase_cost} /></td>
                          <td><Money value={a.net_book_value} /></td>
                          <td><DepPct pct={a.depreciation_pct} /></td>
                          <td><StatusBadge status={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--gray-100)', fontWeight: 600 }}>
                        <td colSpan={2} style={{ fontSize: 12, color: 'var(--gray-600)' }}>TOTAL ({deptAssets.length} assets)</td>
                        <td><Money value={deptAssets.reduce((s, a) => s + a.purchase_cost, 0)} /></td>
                        <td><Money value={deptAssets.reduce((s, a) => s + a.net_book_value, 0)} /></td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
