export function StatusBadge({ status }) {
  const map = {
    'Active': 'badge-green',
    'Under Repair': 'badge-gold',
    'Disposed': 'badge-red',
    'Written Off': 'badge-gray',
  }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
}

export function ConditionBadge({ condition }) {
  const map = { 'Good': 'badge-green', 'Fair': 'badge-gold', 'Poor': 'badge-red' }
  return <span className={`badge ${map[condition] || 'badge-gray'}`}>{condition}</span>
}

export function DepBar({ pct }) {
  const color = pct > 80 ? 'var(--red)' : pct > 40 ? 'var(--gold)' : 'var(--green)'
  return (
    <div className="dep-bar-track">
      <div className="dep-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  )
}

export function DepPct({ pct }) {
  const color = pct > 80 ? 'var(--red)' : pct > 40 ? 'var(--gold)' : 'var(--green)'
  return <span style={{ color, fontWeight: 600 }}>{pct}%</span>
}

export function Money({ value }) {
  return (
    <span className="money">
      ₦{Number(value).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
    </span>
  )
}

export function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
      Loading…
    </div>
  )
}

export function ConfirmModal({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="flex gap-8">
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            Confirm
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
