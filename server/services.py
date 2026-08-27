"""
services.py — Pure business logic. No Flask, no HTTP. 
Both the template views and JSON API import from here.
"""
from datetime import datetime, date
from db import get_db


# ─── CATEGORY CONFIG ──────────────────────────────────────────────────────────

CATEGORY_LIFE = {
    'Furniture and Fittings': 5,
    'Motor Vehicle':          4,
    'Plant and Machinery':    5,
    'Office Equipment':       5,
    'Infrastructure':         5,
    'Land and Building':      50,
}

CATEGORIES = list(CATEGORY_LIFE.keys())


# ─── DEPRECIATION ─────────────────────────────────────────────────────────────

def calc_depreciation(asset):
    """Return (accumulated, net_book_value, pct, annual_depreciation)."""
    purchase_date = datetime.strptime(asset['purchase_date'], '%Y-%m-%d').date()
    cost = asset['purchase_cost']
    # Use canonical life from category if available, else fall back to stored value
    life = CATEGORY_LIFE.get(asset['category']) or asset['useful_life_years'] or 5
    years_used = (date.today() - purchase_date).days / 365.25
    annual = cost / life
    accumulated = min(annual * years_used, cost)
    nbv = cost - accumulated
    pct = (accumulated / cost * 100) if cost else 0
    return round(accumulated, 2), round(nbv, 2), round(pct, 1), round(annual, 2)


def enrich_asset(row):
    """Convert a DB row to a dict and attach depreciation fields."""
    d = dict(row)
    acc, nbv, pct, annual = calc_depreciation(row)
    d['dep_info'] = (acc, nbv, pct, annual)
    d['accumulated_depreciation'] = acc
    d['net_book_value'] = nbv
    d['depreciation_pct'] = pct
    d['annual_depreciation'] = annual
    return d


# ─── DASHBOARD ────────────────────────────────────────────────────────────────

def get_dashboard_data():
    with get_db() as db:
        total       = db.execute("SELECT COUNT(*) FROM asset").fetchone()[0]
        active      = db.execute("SELECT COUNT(*) FROM asset WHERE status='Active'").fetchone()[0]
        total_cost  = db.execute("SELECT COALESCE(SUM(purchase_cost),0) FROM asset").fetchone()[0]
        all_assets  = db.execute("SELECT * FROM asset").fetchall()
        total_nbv   = sum(calc_depreciation(a)[1] for a in all_assets)
        by_cat      = db.execute("SELECT category, COUNT(*) as c FROM asset GROUP BY category").fetchall()
        by_status   = db.execute("SELECT status, COUNT(*) as c FROM asset GROUP BY status").fetchall()
        by_dept     = db.execute("""
            SELECT d.name, COUNT(a.id) as c FROM department d
            LEFT JOIN asset a ON a.department_id = d.id
            GROUP BY d.name HAVING c > 0
        """).fetchall()
        recent_rows = db.execute("""
            SELECT a.*, d.name as dept_name FROM asset a
            JOIN department d ON d.id = a.department_id
            ORDER BY a.created_at DESC LIMIT 5
        """).fetchall()

    return {
        'total_assets':      total,
        'active_assets':     active,
        'total_cost':        total_cost,
        'total_nbv':         total_nbv,
        'total_depreciation': total_cost - total_nbv,
        'by_category':       [dict(r) for r in by_cat],
        'by_status':         [dict(r) for r in by_status],
        'by_department':     [dict(r) for r in by_dept],
        'recent_assets':     [enrich_asset(r) for r in recent_rows],
    }


# ─── ASSETS ───────────────────────────────────────────────────────────────────

def get_assets(search='', category='', status='', dept_id=''):
    with get_db() as db:
        q = """
            SELECT a.*, d.name as dept_name
            FROM asset a JOIN department d ON d.id = a.department_id
            WHERE 1=1
        """
        params = []
        if search:
            q += " AND (a.name LIKE ? OR a.tag_number LIKE ? OR a.assigned_to LIKE ? OR a.serial_number LIKE ?)"
            params += [f'%{search}%'] * 4
        if category:
            q += " AND a.category = ?"; params.append(category)
        if status:
            q += " AND a.status = ?"; params.append(status)
        if dept_id:
            q += " AND a.department_id = ?"; params.append(dept_id)
        q += " ORDER BY a.created_at DESC"

        rows        = db.execute(q, params).fetchall()
        departments = db.execute("SELECT * FROM department ORDER BY name").fetchall()

    return {
        'assets':      [enrich_asset(r) for r in rows],
        'departments': [dict(d) for d in departments],
        'categories':  CATEGORIES,
    }


def get_asset(asset_id):
    with get_db() as db:
        row = db.execute("""
            SELECT a.*, d.name as dept_name FROM asset a
            JOIN department d ON d.id = a.department_id
            WHERE a.id = ?
        """, (asset_id,)).fetchone()
        if not row:
            return None, []
        logs = db.execute(
            "SELECT * FROM maintenance_log WHERE asset_id = ? ORDER BY date DESC",
            (asset_id,)
        ).fetchall()
    return enrich_asset(row), [dict(l) for l in logs]


def create_asset(data):
    category = data['category']
    life = CATEGORY_LIFE.get(category, int(data.get('useful_life_years', 5)))
    with get_db() as db:
        db.execute("""
            INSERT INTO asset (tag_number, name, category, brand, model, serial_number,
                purchase_date, purchase_cost, useful_life_years, department_id,
                assigned_to, location, status, condition, notes, description, manufacturer, date_added)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            data['tag_number'], data['name'], category,
            data.get('brand') or None, data.get('model') or None,
            data.get('serial_number') or None, data['purchase_date'],
            float(data['purchase_cost']), life,
            int(data['department_id']), data.get('assigned_to') or None,
            data.get('location') or None, data.get('status', 'Active'),
            data.get('condition', 'Good'), data.get('notes') or None,
            data.get('description') or None, data.get('manufacturer') or None,
            data.get('date_added') or date.today().strftime('%Y-%m-%d'),
        ))


def update_asset(asset_id, data):
    category = data['category']
    life = CATEGORY_LIFE.get(category, int(data.get('useful_life_years', 5)))
    with get_db() as db:
        row = db.execute("SELECT * FROM asset WHERE id = ?", (asset_id,)).fetchone()
        if not row:
            return False
        db.execute("""
            UPDATE asset SET
                tag_number=?, name=?, category=?, brand=?, model=?, serial_number=?,
                purchase_date=?, purchase_cost=?, useful_life_years=?, department_id=?,
                assigned_to=?, location=?, status=?, condition=?, notes=?,
                description=?, manufacturer=?,
                date_added=?, updated_at=datetime('now')
            WHERE id=?
        """, (
            data['tag_number'], data['name'], category,
            data.get('brand') or None, data.get('model') or None,
            data.get('serial_number') or None, data['purchase_date'],
            float(data['purchase_cost']), life,
            int(data['department_id']), data.get('assigned_to') or None,
            data.get('location') or None, data.get('status', 'Active'),
            data.get('condition', 'Good'), data.get('notes') or None,
            data.get('description') or None, data.get('manufacturer') or None,
            data.get('date_added') or row['date_added'] or date.today().strftime('%Y-%m-%d'),
            asset_id,
        ))
        return True


def delete_asset(asset_id):
    with get_db() as db:
        db.execute("DELETE FROM asset WHERE id = ?", (asset_id,))


def add_maintenance_log(asset_id, data):
    with get_db() as db:
        db.execute("""
            INSERT INTO maintenance_log (asset_id, date, description, cost, performed_by)
            VALUES (?,?,?,?,?)
        """, (
            asset_id, data['date'], data['description'],
            float(data.get('cost', 0)), data.get('performed_by') or None,
        ))


def update_maintenance_log(log_id, data):
    with get_db() as db:
        db.execute("""
            UPDATE maintenance_log
            SET date=?, description=?, cost=?, performed_by=?
            WHERE id=?
        """, (
            data['date'], data['description'],
            float(data.get('cost', 0)), data.get('performed_by') or None,
            log_id,
        ))


def delete_maintenance_log(log_id):
    with get_db() as db:
        db.execute("DELETE FROM maintenance_log WHERE id=?", (log_id,))


# ─── DEPARTMENTS ──────────────────────────────────────────────────────────────

def get_departments():
    with get_db() as db:
        rows = db.execute("""
            SELECT d.*, COUNT(a.id) as asset_count FROM department d
            LEFT JOIN asset a ON a.department_id = d.id
            GROUP BY d.id ORDER BY d.name
        """).fetchall()
    return [dict(r) for r in rows]


def create_department(name):
    with get_db() as db:
        db.execute("INSERT INTO department (name) VALUES (?)", (name,))


def update_department(dept_id, name):
    with get_db() as db:
        db.execute("UPDATE department SET name = ? WHERE id = ?", (name, dept_id))


def delete_department(dept_id):
    with get_db() as db:
        count = db.execute(
            "SELECT COUNT(*) FROM asset WHERE department_id = ?", (dept_id,)
        ).fetchone()[0]
        if count:
            raise ValueError("Cannot delete a department that has assets assigned to it.")
        db.execute("DELETE FROM department WHERE id = ?", (dept_id,))


# ─── REPORTS ──────────────────────────────────────────────────────────────────

def get_report_data():
    with get_db() as db:
        rows = db.execute("""
            SELECT a.*, d.name as dept_name FROM asset a
            JOIN department d ON d.id = a.department_id
            ORDER BY d.name, a.name
        """).fetchall()
        departments = db.execute("SELECT * FROM department ORDER BY name").fetchall()

    assets = [enrich_asset(r) for r in rows]

    dept_summary = []
    for dept in departments:
        da = [a for a in assets if a['department_id'] == dept['id']]
        if not da:
            continue
        total_cost = sum(a['purchase_cost'] for a in da)
        total_nbv  = sum(a['net_book_value'] for a in da)
        dept_summary.append({
            'name':       dept['name'],
            'count':      len(da),
            'total_cost': total_cost,
            'total_nbv':  total_nbv,
            'total_dep':  total_cost - total_nbv,
        })

    return {'assets': assets, 'dept_summary': dept_summary, 'today': date.today()}


def get_csv_rows():
    """Return (headers, rows) for CSV export."""
    with get_db() as db:
        rows = db.execute("""
            SELECT a.*, d.name as dept_name FROM asset a
            JOIN department d ON d.id = a.department_id
            ORDER BY d.name, a.name
        """).fetchall()

    headers = [
        'Tag Number', 'Asset Name', 'Category', 'Brand', 'Model', 'Serial Number',
        'Manufacturer', 'Description', 'Date Added', 'Purchase Date',
        'Purchase Cost (NGN)', 'Useful Life (Yrs)',
        'Department', 'Assigned To', 'Location', 'Status', 'Condition',
        'Accum. Depreciation (NGN)', 'Net Book Value (NGN)', 'Depreciation %',
    ]
    data_rows = []
    for r in rows:
        acc, nbv, pct, _ = calc_depreciation(r)
        data_rows.append([
            r['tag_number'], r['name'], r['category'],
            r['brand'] or '', r['model'] or '', r['serial_number'] or '',
            r['manufacturer'] or '', r['description'] or '',
            r['date_added'] or '', r['purchase_date'],
            f"{r['purchase_cost']:,.2f}", r['useful_life_years'],
            r['dept_name'], r['assigned_to'] or '', r['location'] or '',
            r['status'], r['condition'],
            f"{acc:,.2f}", f"{nbv:,.2f}", f"{pct}%",
        ])
    return headers, data_rows
