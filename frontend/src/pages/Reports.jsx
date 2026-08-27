import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { StatusBadge, Money, Loading } from '../components/Shared'
import { api } from '../api/client'

export default function Reports() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.reports().then(setData).catch(console.error)
  }, [])

  if (!data) return <Layout title="Reports"><Loading /></Layout>

  const totals = data.dept_summary.reduce(
    (acc, r) => ({
      count: acc.count + r.count,
      cost: acc.cost + r.total_cost,
      dep: acc.dep + r.total_dep,
      nbv: acc.nbv + r.total_nbv,
    }),
    { count: 0, cost: 0, dep: 0, nbv: 0 }
  )

  const today = new Date(data.today).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <Layout title="Reports">
      <div className="page-header">
        <div>
          <h1>Asset Reports</h1>
          <p>Depreciation schedule and departmental summary — as at {today}</p>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-secondary" onClick={() => window.print()}>⎙ Print</button>
          <button className="btn btn-gold" onClick={api.exportCsv}>↓ Export CSV</button>
        </div>
      </div>

      {/* Departmental Summary */}
      <div className="card mb-24">
        <div className="card-header"><span className="card-title">Departmental Asset Summary</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th style={{ textAlign: 'right' }}>Assets</th>
                <th style={{ textAlign: 'right' }}>Gross Cost (₦)</th>
                <th style={{ textAlign: 'right' }}>Accum. Dep. (₦)</th>
                <th style={{ textAlign: 'right' }}>Net Book Value (₦)</th>
                <th style={{ textAlign: 'right' }}>Dep %</th>
              </tr>
            </thead>
            <tbody>
              {data.dept_summary.map(row => {
                const pct = row.total_cost ? (row.total_dep / row.total_cost * 100).toFixed(1) : null
                const color = pct > 80 ? 'var(--red)' : pct > 40 ? 'var(--gold)' : 'var(--green)'
                return (
                  <tr key={row.name}>
                    <td><strong>{row.name}</strong></td>
                    <td style={{ textAlign: 'right' }}><span className="badge badge-blue">{row.count}</span></td>
                    <td style={{ textAlign: 'right' }}><Money value={row.total_cost} /></td>
                    <td style={{ textAlign: 'right', color: 'var(--red)' }}><Money value={row.total_dep} /></td>
                    <td style={{ textAlign: 'right' }}><strong><Money value={row.total_nbv} /></strong></td>
                    <td style={{ textAlign: 'right' }}>
                      {pct ? <span style={{ color, fontWeight: 600 }}>{pct}%</span> : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gray-100)', fontWeight: 700 }}>
                <td>TOTAL</td>
                <td style={{ textAlign: 'right' }}>{totals.count}</td>
                <td style={{ textAlign: 'right' }}><Money value={totals.cost} /></td>
                <td style={{ textAlign: 'right', color: 'var(--red)' }}><Money value={totals.dep} /></td>
                <td style={{ textAlign: 'right' }}><Money value={totals.nbv} /></td>
                <td style={{ textAlign: 'right' }}>
                  {totals.cost ? `${(totals.dep / totals.cost * 100).toFixed(1)}%` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Full Depreciation Schedule */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Full Depreciation Schedule</span>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Straight-Line Method</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tag No.</th>
                <th>Asset Name</th>
                <th>Department</th>
                <th>Purchase Date</th>
                <th>Date Added</th>
                <th style={{ textAlign: 'right' }}>Cost (₦)</th>
                <th style={{ textAlign: 'center' }}>Life</th>
                <th style={{ textAlign: 'right' }}>Ann. Dep (₦)</th>
                <th style={{ textAlign: 'right' }}>Accum. Dep (₦)</th>
                <th style={{ textAlign: 'right' }}>NBV (₦)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.assets.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>
                    No assets found.
                  </td>
                </tr>
              ) : data.assets.map(a => (
                <tr key={a.id}>
                  <td><span className="tag-number">{a.tag_number}</span></td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</td>
                  <td style={{ fontSize: 12 }}>{a.dept_name}</td>
                  <td className="tag-number">{a.purchase_date}</td>
                  <td className="tag-number">{a.date_added || '—'}</td>
                  <td style={{ textAlign: 'right' }}><Money value={a.purchase_cost} /></td>
                  <td style={{ textAlign: 'center' }}>{a.useful_life_years}yr</td>
                  <td style={{ textAlign: 'right' }}><Money value={a.annual_depreciation} /></td>
                  <td style={{ textAlign: 'right', color: 'var(--red)' }}><Money value={a.accumulated_depreciation} /></td>
                  <td style={{ textAlign: 'right' }}><strong><Money value={a.net_book_value} /></strong></td>
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
