"""
api.py — JSON API routes (Blueprint).
Consumed by the React frontend.
No flask_cors needed — CORS headers are added globally in app.py.
"""
from flask import Blueprint, request, jsonify, make_response
import csv, io
import services

# Removed url_prefix='/api'
api_bp = Blueprint('api', __name__)


# ─── DASHBOARD ────────────────────────────────────────────────────────────────

@api_bp.route('/api/dashboard')
def dashboard():
    return jsonify(services.get_dashboard_data())


# ─── ASSETS ───────────────────────────────────────────────────────────────────

@api_bp.route('/api/assets')
def list_assets():
    result = services.get_assets(
        search   = request.args.get('search', ''),
        category = request.args.get('category', ''),
        status   = request.args.get('status', ''),
        dept_id  = request.args.get('department', ''),
    )
    return jsonify(result)


@api_bp.route('/api/assets/<int:id>')
def get_asset(id):
    asset, logs = services.get_asset(id)
    if not asset:
        return jsonify({'error': 'Asset not found'}), 404
    return jsonify({'asset': asset, 'logs': logs})


@api_bp.route('/api/assets', methods=['POST'])
def create_asset():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    try:
        services.create_asset(data)
        return jsonify({'ok': True}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@api_bp.route('/api/assets/<int:id>', methods=['PUT'])
def update_asset(id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    found = services.update_asset(id, data)
    if not found:
        return jsonify({'error': 'Asset not found'}), 404
    return jsonify({'ok': True})


@api_bp.route('/api/assets/<int:id>', methods=['DELETE'])
def delete_asset(id):
    services.delete_asset(id)
    return jsonify({'ok': True})


@api_bp.route('/api/assets/<int:id>/maintenance', methods=['POST'])
def add_maintenance(id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    try:
        services.add_maintenance_log(id, data)
        return jsonify({'ok': True}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@api_bp.route('/api/maintenance/<int:log_id>', methods=['PUT'])
def update_maintenance(log_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    try:
        services.update_maintenance_log(log_id, data)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@api_bp.route('/api/maintenance/<int:log_id>', methods=['DELETE'])
def delete_maintenance(log_id):
    try:
        services.delete_maintenance_log(log_id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ─── DEPARTMENTS ──────────────────────────────────────────────────────────────

@api_bp.route('/api/departments')
def list_departments():
    return jsonify({'departments': services.get_departments()})


@api_bp.route('/api/departments', methods=['POST'])
def create_department():
    data = request.get_json()
    name = (data.get('name') or '').strip() if data else ''
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    try:
        services.create_department(name)
        return jsonify({'ok': True}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@api_bp.route('/api/departments/<int:id>')
def get_department(id):
    with __import__('db').get_db() as db:
        dept = db.execute("SELECT * FROM department WHERE id=?", (id,)).fetchone()
        if not dept:
            return jsonify({'error': 'Department not found'}), 404
    return jsonify({'department': dict(dept)})


@api_bp.route('/api/departments/<int:id>/assets')
def get_department_assets(id):
    result = services.get_assets(dept_id=str(id))
    with __import__('db').get_db() as db:
        dept = db.execute("SELECT * FROM department WHERE id=?", (id,)).fetchone()
        if not dept:
            return jsonify({'error': 'Department not found'}), 404
    return jsonify({
        'department': dict(dept),
        'assets': result['assets'],
    })


@api_bp.route('/api/departments/<int:id>', methods=['PUT'])
def update_department(id):
    data = request.get_json()
    name = (data.get('name') or '').strip() if data else ''
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    services.update_department(id, name)
    return jsonify({'ok': True})


@api_bp.route('/api/departments/<int:id>', methods=['DELETE'])
def delete_department(id):
    try:
        services.delete_department(id)
        return jsonify({'ok': True})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


# ─── REPORTS ──────────────────────────────────────────────────────────────────

@api_bp.route('/api/reports')
def reports():
    data = services.get_report_data()
    return jsonify({
        'assets':       data['assets'],
        'dept_summary': data['dept_summary'],
        'today':        data['today'].isoformat(),
    })


@api_bp.route('/api/reports/export')
def export_csv():
    headers, rows = services.get_csv_rows()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(headers)
    w.writerows(rows)
    resp = make_response(output.getvalue())
    resp.headers['Content-Disposition'] = 'attachment; filename=NMDPRA_Asset_Register.csv'
    resp.headers['Content-Type'] = 'text/csv'
    return resp