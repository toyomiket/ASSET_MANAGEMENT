const BASE = import.meta.env.VITE_API_URL

async function req(path, options = {}) {
  let res
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Is Flask running on port 5000?')
  }
  console.log(BASE + path)

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(`Server error (${res.status}). Check the Flask terminal for details.`)
  }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const api = {
  dashboard: () => req('/dashboard'),

  assets: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req('/assets' + (q ? '?' + q : ''))
  },
  getAsset: (id) => req(`/assets/${id}`),
  createAsset: (data) => req('/assets', { method: 'POST', body: data }),
  updateAsset: (id, data) => req(`/assets/${id}`, { method: 'PUT', body: data }),
  deleteAsset: (id) => req(`/assets/${id}`, { method: 'DELETE' }),
  addMaintenance: (id, data) => req(`/assets/${id}/maintenance`, { method: 'POST', body: data }),
  updateMaintenance: (logId, data) => req(`/maintenance/${logId}`, { method: 'PUT', body: data }),
  deleteMaintenance: (logId) => req(`/maintenance/${logId}`, { method: 'DELETE' }),

  departments: () => req('/departments'),
  getDepartmentAssets: (id) => req(`/departments/${id}/assets`),
  createDepartment: (name) => req('/departments', { method: 'POST', body: { name } }),
  updateDepartment: (id, name) => req(`/departments/${id}`, { method: 'PUT', body: { name } }),
  deleteDepartment: (id) => req(`/departments/${id}`, { method: 'DELETE' }),

  reports: () => req('/reports'),

  exportCsv: () => window.open(`${BASE}/reports/export`, '_blank'),
}
