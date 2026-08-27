import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StatusBadge, DepPct, Money, Loading } from '../components/Shared'
import { api } from '../api/client'

const CATEGORIES = [
  'Furniture and Fittings',
  'Motor Vehicle',
  'Plant and Machinery',
  'Office Equipment',
  'Infrastructure',
  'Land and Building',
]

const CAT_ICONS = {
  'Furniture and Fittings': '🪑',
  'Motor Vehicle':          '🚗',
  'Plant and Machinery':    '⚙️',
  'Office Equipment':       '🖥️',
  'Infrastructure':         '🏗️',
  'Land and Building':      '🏢',
}

export default function Assets() {
  const [data, setData] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const search     = searchParams.get('search') || ''
  const category   = searchParams.get('category') || ''
  const status     = searchParams.get('status') || ''
  const department = searchParams.get('department') || ''

  const [draft, setDraft] = useState({ search, category, status, department })
  const [allData, setAllData] = useState(null)

  useEffect(() => {
    api.assets({}).then(setAllData).catch(console.error)
  }, [])

  useEffect(() => {
    const params = {}
    if (search)     params.search     = search
    if (category)   params.category   = category
    if (status)     params.status     = status
    if (department) params.department = department
    api.assets(params).then(setData).catch(console.error)
  }, [search, category, status, department])

  function handleFilter(e) {
    e.preventDefault()
    const p = {}
    if (draft.search)     p.search     = draft.search
    if (draft.category)   p.category   = draft.category
    if (draft.status)     p.status     = draft.status
    if (draft.department) p.department = draft.department
    setSearchParams(p)
  }

  function clearFilter() {
    setDraft({ search: '', category: '', status: '', department: '' })
    setSearchParams({})
  }

  function selectCategory(cat) {
    const newCat = cat === category ? '' : cat
    setDraft(d => ({ ...d, category: newCat }))
    const p = {}
    if (search)     p.search     = search
    if (newCat)     p.category   = newCat
    if (status)     p.status     = status
    if (department) p.department = department
    setSearchParams(p)
  }

  const catCounts = {}
  if (allData) {
    for (const a of allData.assets) {
      catCounts[a.category] = (catCounts[a.category] || 0) + 1
    }
  }

  return (
    <Layout title="Asset Register">
      <div className="page-header">
        <div>
          <h1>Asset Register</h1>
          <p>{data ? `${data.assets.length} asset(s) found` : 'Loading…'}</p>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-secondary" onClick={api.exportCsv}>↓ Export CSV</button>
          <Link to="/assets/new" className="btn btn-primary">＋ Add Asset</Link>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => selectCategory('')}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1.5px solid',
            borderColor: !category ? 'var(--green)' : 'var(--gray-200)',
            background: !category ? 'var(--green-light)' : 'var(--white)',
            color: !category ? 'var(--green-dark)' : 'var(--gray-600)',
            fontWeight: !category ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          All Assets
          <span style={{
            marginLeft: 8, background: !category ? 'var(--green)' : 'var(--gray-200)',
            color: !category ? 'white' : 'var(--gray-600)',
            borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700
          }}>
            {allData ? allData.assets.length : '…'}
          </span>
        </button>
        {CATEGORIES.map(cat => {
          const active = category === cat
          const count  = catCounts[cat] || 0
          return (
            <button key={cat} onClick={() => selectCategory(cat)} style={{
              padding: '8px 16px', borderRadius: 8, border: '1.5px solid',
              borderColor: active ? 'var(--green)' : 'var(--gray-200)',
              background: active ? 'var(--green-light)' : 'var(--white)',
              color: active ? 'var(--green-dark)' : 'var(--gray-600)',
              fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
            }}>
              {CAT_ICONS[cat]} {cat}
              <span style={{
                marginLeft: 8, background: active ? 'var(--green)' : 'var(--gray-200)',
                color: active ? 'white' : 'var(--gray-600)',
                borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="card mb-16">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <form onSubmit={handleFilter} className="search-bar">
            <input
              type="text"
              placeholder="Search by name, tag, serial, assigned to…"
              value={draft.search}
              onChange={e => setDraft(d => ({ ...d, search: e.target.value }))}
              style={{ minWidth: 260 }}
            />
            <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {['Active', 'Under Repair', 'Disposed', 'Written Off'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={draft.department} onChange={e => setDraft(d => ({ ...d, department: e.target.value }))}>
              <option value="">All Departments</option>
              {data?.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button type="submit" className="btn btn-primary btn-sm">Filter</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilter}>Clear</button>
          </form>
        </div>
      </div>

      <div className="card">
        {!data ? <Loading /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tag No.</th>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Assigned To</th>
                  <th>In-Service Date</th>
                  <th>Purchase Date</th>
                  <th>Cost (₦)</th>
                  <th>NBV (₦)</th>
                  <th>Dep%</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.assets.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
                      No assets found.{' '}
                      <Link to="/assets/new" style={{ color: 'var(--green)' }}>Add the first one →</Link>
                    </td>
                  </tr>
                ) : data.assets.map(a => (
                  <tr key={a.id}>
                    <td><span className="tag-number">{a.tag_number}</span></td>
                    <td>
                      <Link to={`/assets/${a.id}`} style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 500 }}>
                        {a.name}
                      </Link>
                      {a.brand && <div className="text-muted">{a.brand}{a.model ? ` ${a.model}` : ''}</div>}
                    </td>
                    <td>
                      <span className="badge badge-blue">{CAT_ICONS[a.category]} {a.category}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{a.dept_name}</td>
                    <td style={{ fontSize: 13 }}>{a.assigned_to || '—'}</td>
                    <td className="tag-number">{a.date_added || '—'}</td>
                    <td className="tag-number">{a.purchase_date}</td>
                    <td><Money value={a.purchase_cost} /></td>
                    <td><Money value={a.net_book_value} /></td>
                    <td><DepPct pct={a.depreciation_pct} /></td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <div className="flex gap-8">
                        <Link to={`/assets/${a.id}`} className="btn btn-secondary btn-sm">View</Link>
                        <Link to={`/assets/${a.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
