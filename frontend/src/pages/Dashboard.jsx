import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StatusBadge, Money, Loading } from '../components/Shared'
import { api } from '../api/client'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.dashboard().then(setData).catch(e => setError(e.message))
  }, [])

  if (error) return (
    <Layout title="Dashboard">
      <div style={{ color: 'var(--red)', padding: 24, background: 'var(--red-light)', borderRadius: 8 }}>
        Could not connect to the Flask backend. Make sure <code>python app.py</code> is running on port 5000.<br /><br />
        Error: {error}
      </div>
    </Layout>
  )

  if (!data) return <Layout title="Dashboard"><Loading /></Layout>

  const depPct = data.total_cost
    ? ((data.total_depreciation / data.total_cost) * 100).toFixed(1)
    : 0

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <h1>Asset Overview</h1>
          <p>Nigerian Midstream &amp; Downstream Petroleum Regulatory Authority — Finance Department</p>
        </div>
        <Link to="/assets/new" className="btn btn-primary">＋ Add Asset</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Assets</div>
          <div className="stat-value">{data.total_assets}</div>
          <div className="stat-sub">{data.active_assets} active</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Total Cost (NGN)</div>
          <div className="stat-value"><Money value={data.total_cost} /></div>
          <div className="stat-sub">Gross asset value</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Net Book Value</div>
          <div className="stat-value"><Money value={data.total_nbv} /></div>
          <div className="stat-sub">After depreciation</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-label">Accumulated Depreciation</div>
          <div className="stat-value"><Money value={data.total_depreciation} /></div>
          <div className="stat-sub">{depPct}% of cost</div>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-header"><span className="card-title">Assets by Category</span></div>
          <div style={{ padding: 0 }}>
            <table>
              <thead><tr><th>Category</th><th style={{ textAlign: 'right' }}>Count</th></tr></thead>
              <tbody>
                {data.by_category.map(row => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td style={{ textAlign: 'right' }}><span className="badge badge-green">{row.c}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Assets by Status</span></div>
          <div style={{ padding: 0 }}>
            <table>
              <thead><tr><th>Status</th><th style={{ textAlign: 'right' }}>Count</th></tr></thead>
              <tbody>
                {data.by_status.map(row => (
                  <tr key={row.status}>
                    <td><StatusBadge status={row.status} /></td>
                    <td style={{ textAlign: 'right' }}><strong>{row.c}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ borderTop: '1px solid var(--gray-200)', padding: '14px 20px 8px', fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>
            By Department
          </div>
          <div style={{ padding: 0 }}>
            <table>
              <tbody>
                {data.by_department.map(row => (
                  <tr key={row.name}>
                    <td style={{ fontSize: 13 }}>{row.name}</td>
                    <td style={{ textAlign: 'right' }}><span className="badge badge-blue">{row.c}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recently Added Assets</span>
          <Link to="/assets" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tag No.</th><th>Asset Name</th><th>Department</th>
                <th>Cost (₦)</th><th>Net Book Value</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_assets.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>No assets yet.</td></tr>
              ) : data.recent_assets.map(a => (
                <tr key={a.id}>
                  <td><span className="tag-number">{a.tag_number}</span></td>
                  <td>
                    <Link to={`/assets/${a.id}`} style={{ color: 'var(--green)', fontWeight: 500 }}>
                      {a.name}
                    </Link>
                  </td>
                  <td>{a.dept_name}</td>
                  <td><Money value={a.purchase_cost} /></td>
                  <td><Money value={a.net_book_value} /></td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
