import { NavLink, useLocation } from 'react-router-dom'
import { api } from '../api/client'

export function Sidebar() {
  const location = useLocation()
  const isAssetActive = location.pathname.startsWith('/assets')

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo">
          <div className="logo-mark">NMD</div>
          <div className="logo-text">
            <strong>NMDPRA</strong>
            <span>Asset Management</span>
          </div>
        </NavLink>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">Main Menu</div>
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <span className="nav-icon">◈</span> Dashboard
        </NavLink>
        <NavLink to="/assets" className={'nav-link' + (isAssetActive ? ' active' : '')}>
          <span className="nav-icon">⬡</span> Asset Register
        </NavLink>
        <NavLink to="/assets/new" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <span className="nav-icon">＋</span> Add New Asset
        </NavLink>
        <div className="nav-section">Management</div>
        <NavLink to="/departments" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <span className="nav-icon">▤</span> Departments
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <span className="nav-icon">◫</span> Reports
        </NavLink>
        <button
          className="nav-link"
          onClick={api.exportCsv}
          style={{ background: 'none', width: '100%', border: 'none', textAlign: 'left' }}
        >
          <span className="nav-icon">↓</span> Export to CSV
        </button>
      </nav>
      <div className="sidebar-footer">
        Nigerian Midstream &amp; Downstream<br />Petroleum Regulatory Authority<br />
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>— Finance Dept ITAM System —</span>
      </div>
    </aside>
  )
}

export function Layout({ title, children }) {
  const date = new Date().toLocaleDateString('en-NG', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <span className="topbar-date">{date}</span>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
