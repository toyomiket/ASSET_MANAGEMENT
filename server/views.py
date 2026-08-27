"""
views.py — HTML template routes (Blueprint).
"""
import io, csv
from flask import (
    Blueprint, render_template, request,
    redirect, url_for, flash, make_response
)
from db import get_db
import services

views_bp = Blueprint('views', __name__)


@views_bp.route('/')
def dashboard():
    return render_template('dashboard.html', **services.get_dashboard_data())


@views_bp.route('/assets')
def assets():
    result = services.get_assets(
        search   = request.args.get('search', ''),
        category = request.args.get('category', ''),
        status   = request.args.get('status', ''),
        dept_id  = request.args.get('department', ''),
    )
    return render_template('assets.html',
        assets            = result['assets'],
        departments       = result['departments'],
        categories        = result['categories'],
        search            = request.args.get('search', ''),
        selected_category = request.args.get('category', ''),
        selected_status   = request.args.get('status', ''),
        selected_dept     = request.args.get('department', ''),
    )


@views_bp.route('/assets/new', methods=['GET', 'POST'])
def new_asset():
    with get_db() as db:
        departments = db.execute("SELECT * FROM department ORDER BY name").fetchall()
    if request.method == 'POST':
        services.create_asset(request.form)
        flash('Asset added successfully!', 'success')
        return redirect(url_for('views.assets'))
    return render_template('asset_form.html', asset=None, departments=departments)


@views_bp.route('/assets/<int:id>')
def view_asset(id):
    asset, logs = services.get_asset(id)
    if not asset:
        return "Not found", 404
    return render_template('asset_detail.html', asset=asset, logs=logs)


@views_bp.route('/assets/<int:id>/edit', methods=['GET', 'POST'])
def edit_asset(id):
    asset, _ = services.get_asset(id)
    if not asset:
        return "Not found", 404
    with get_db() as db:
        departments = db.execute("SELECT * FROM department ORDER BY name").fetchall()
    if request.method == 'POST':
        services.update_asset(id, request.form)
        flash('Asset updated!', 'success')
        return redirect(url_for('views.view_asset', id=id))
    return render_template('asset_form.html', asset=asset, departments=departments)


@views_bp.route('/assets/<int:id>/delete', methods=['POST'])
def delete_asset(id):
    services.delete_asset(id)
    flash('Asset deleted.', 'warning')
    return redirect(url_for('views.assets'))


@views_bp.route('/assets/<int:id>/maintenance', methods=['POST'])
def add_maintenance(id):
    services.add_maintenance_log(id, request.form)
    flash('Maintenance record added.', 'success')
    return redirect(url_for('views.view_asset', id=id))


@views_bp.route('/departments')
def departments():
    return render_template('departments.html', departments=services.get_departments())


@views_bp.route('/departments/new', methods=['POST'])
def new_department():
    name = request.form.get('name', '').strip()
    if name:
        services.create_department(name)
        flash(f'Department "{name}" added.', 'success')
    return redirect(url_for('views.departments'))


@views_bp.route('/departments/<int:id>/edit', methods=['POST'])
def edit_department(id):
    name = request.form.get('name', '').strip()
    if name:
        services.update_department(id, name)
        flash(f"Department renamed to '{name}'.", 'success')
    return redirect(url_for('views.departments'))


@views_bp.route('/departments/<int:id>/delete', methods=['POST'])
def delete_department(id):
    try:
        services.delete_department(id)
        flash('Department deleted.', 'warning')
    except ValueError as e:
        flash(str(e), 'danger')
    return redirect(url_for('views.departments'))


@views_bp.route('/reports')
def reports():
    data = services.get_report_data()
    return render_template('reports.html',
        assets       = data['assets'],
        dept_summary = data['dept_summary'],
        today        = data['today'],
    )


@views_bp.route('/reports/export')
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
