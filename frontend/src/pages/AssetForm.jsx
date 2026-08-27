import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Loading } from '../components/Shared'
import { useToast } from '../components/Toast'
import { api } from '../api/client'

const CATEGORY_LIFE = {
  'Furniture and Fittings': 5,
  'Motor Vehicle':          4,
  'Plant and Machinery':    5,
  'Office Equipment':       5,
  'Infrastructure':         5,
  'Land and Building':      50,
}

const CATEGORIES = Object.keys(CATEGORY_LIFE)
const STATUSES   = ['Active', 'Under Repair', 'Disposed', 'Written Off']
const CONDITIONS = ['Good', 'Fair', 'Poor']

const EMPTY = {
  tag_number: '', name: '', category: '', brand: '', model: '', serial_number: '',
  manufacturer: '', description: '',
  assigned_to: '', location: '', purchase_date: '', date_added: '',
  purchase_cost: '', useful_life_years: 5, department_id: '',
  status: 'Active', condition: 'Good', notes: ''
}

export default function AssetForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.assets().then(d => setDepartments(d.departments))
    if (isEdit) {
      api.getAsset(id)
        .then(d => {
          const a = d.asset
          setForm({
            tag_number:        a.tag_number || '',
            name:              a.name || '',
            category:          a.category || '',
            brand:             a.brand || '',
            model:             a.model || '',
            serial_number:     a.serial_number || '',
            manufacturer:      a.manufacturer || '',
            description:       a.description || '',
            assigned_to:       a.assigned_to || '',
            location:          a.location || '',
            purchase_date:     a.purchase_date || '',
            date_added:        a.date_added || '',
            purchase_cost:     a.purchase_cost || '',
            useful_life_years: a.useful_life_years || 5,
            department_id:     a.department_id || '',
            status:            a.status || 'Active',
            condition:         a.condition || 'Good',
            notes:             a.notes || ''
          })
          setLoading(false)
        })
        .catch(e => {
          toast(e.message, 'danger')
          setLoading(false)
        })
    }
  }, [id])

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  function handleCategoryChange(e) {
    const cat = e.target.value
    const life = CATEGORY_LIFE[cat] || 5
    setForm(f => ({ ...f, category: cat, useful_life_years: life }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        purchase_cost:     parseFloat(form.purchase_cost),
        useful_life_years: parseInt(form.useful_life_years),
        department_id:     parseInt(form.department_id),
        brand:             form.brand || null,
        model:             form.model || null,
        serial_number:     form.serial_number || null,
        manufacturer:      form.manufacturer || null,
        description:       form.description || null,
        assigned_to:       form.assigned_to || null,
        location:          form.location || null,
        notes:             form.notes || null,
      }
      if (isEdit) {
        await api.updateAsset(id, payload)
        toast('Asset updated successfully!', 'success')
        navigate(`/assets/${id}`)
      } else {
        await api.createAsset(payload)
        toast('Asset added successfully!', 'success')
        navigate('/assets')
      }
    } catch (e) {
      toast(e.message, 'danger')
      setSubmitting(false)
    }
  }

  const title = isEdit ? 'Edit Asset' : 'Add New Asset'
  const selectedLife = CATEGORY_LIFE[form.category]
  const annualDepRate = selectedLife ? Math.round(100 / selectedLife) : null

  if (loading) return <Layout title={title}><Loading /></Layout>

  return (
    <Layout title={title}>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{isEdit ? `Updating details for ${form.name}` : 'Register a new asset in the system'}</p>
        </div>
        <Link to={isEdit ? `/assets/${id}` : '/assets'} className="btn btn-secondary">
          ← Cancel
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Asset Information</span>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>* required fields</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>

            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-400)', marginBottom: 14 }}>
              Identification
            </p>
            <div className="form-grid mb-24">
              <div className="form-group">
                <label>Tag Number *</label>
                <input type="text" required placeholder="e.g. NMDPRA/ICT/001" value={form.tag_number} onChange={set('tag_number')} />
              </div>
              <div className="form-group">
                <label>Asset Name *</label>
                <input type="text" required placeholder="e.g. Dell Latitude 5520 Laptop" value={form.name} onChange={set('name')} />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select required value={form.category} onChange={handleCategoryChange}>
                  <option value="">— Select Category —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Department *</label>
                <select required value={form.department_id} onChange={set('department_id')}>
                  <option value="">— Select Department —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {form.category && (
                <div className="form-group">
                  <label>Useful Life</label>
                  <div style={{
                    padding: '8px 12px', background: 'var(--gray-100)', borderRadius: 6,
                    fontSize: 13, color: 'var(--gray-600)', border: '1px solid var(--gray-200)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span><strong>{selectedLife} years</strong> — auto-set by category</span>
                    <span style={{
                      background: 'var(--blue-light)', color: 'var(--blue)',
                      padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700
                    }}>
                      {annualDepRate}% / yr
                    </span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Manufacturer</label>
                <input type="text" placeholder="e.g. Dell Technologies, Toyota Motor Corp" value={form.manufacturer} onChange={set('manufacturer')} />
              </div>
              <div className="form-group">
                <label>Brand / Make</label>
                <input type="text" placeholder="e.g. Dell, HP, Toyota" value={form.brand} onChange={set('brand')} />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input type="text" placeholder="e.g. Latitude 5520" value={form.model} onChange={set('model')} />
              </div>
              <div className="form-group">
                <label>Serial Number</label>
                <input type="text" placeholder="Manufacturer serial number" value={form.serial_number} onChange={set('serial_number')} />
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <input type="text" placeholder="Name of staff or department" value={form.assigned_to} onChange={set('assigned_to')} />
              </div>
              <div className="form-group full">
                <label>Location</label>
                <input type="text" placeholder="e.g. Finance Office, Floor 2" value={form.location} onChange={set('location')} />
              </div>
              <div className="form-group full">
                <label>Asset Description</label>
                <textarea
                  placeholder="Brief description of this asset — what it is, what it's used for…"
                  value={form.description}
                  onChange={set('description')}
                  rows={3}
                />
              </div>
            </div>

            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-400)', marginBottom: 14 }}>
              Dates &amp; Financials
            </p>
            <div className="form-grid mb-24">
              <div className="form-group">
                <label>In-Service Date *</label>
                <input type="date" required value={form.date_added} onChange={set('date_added')} />
              </div>
              <div className="form-group">
                <label>Purchase Date *</label>
                <input type="date" required value={form.purchase_date} onChange={set('purchase_date')} />
              </div>
              <div className="form-group">
                <label>Purchase Cost (₦) *</label>
                <input type="number" required min="0" step="0.01" placeholder="e.g. 650000" value={form.purchase_cost} onChange={set('purchase_cost')} />
              </div>
            </div>

            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-400)', marginBottom: 14 }}>
              Condition &amp; Notes
            </p>
            <div className="form-grid mb-24">
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={set('status')}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Condition</label>
                <select value={form.condition} onChange={set('condition')}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <label>Notes / Remarks</label>
                <textarea placeholder="Any additional information…" value={form.notes} onChange={set('notes')} />
              </div>
            </div>

            <div className="flex gap-8">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : isEdit ? '✓ Save Changes' : '＋ Add Asset'}
              </button>
              <Link to={isEdit ? `/assets/${id}` : '/assets'} className="btn btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
