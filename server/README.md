# NMDPRA IT Asset Management System
### Nigerian Midstream & Downstream Petroleum Regulatory Authority
**Finance Department — Fixed Asset Register**

---

## Features
- ✅ Full Asset Register (add, edit, view, delete)
- ✅ Straight-line depreciation calculator (auto-computed)
- ✅ Net Book Value tracking per asset
- ✅ Department management & assignment
- ✅ Maintenance / repair log per asset
- ✅ Filter & search assets
- ✅ Departmental summary report
- ✅ Full depreciation schedule
- ✅ Export to CSV (for Excel / audit use)
- ✅ Print-friendly reports

---

## Setup Instructions

### 1. Make sure Python 3.8+ is installed
```bash
python --version
```

### 2. Create a virtual environment (recommended)
```bash
python -m venv venv

# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the application
```bash
python app.py
```

### 5. Open in browser
```
http://127.0.0.1:5000
```

The app will auto-create the database and load sample data on first run.

---

## Asset Tag Number Convention
Suggested format: `NMDPRA/{DEPT_CODE}/{NUMBER}`

Examples:
- `NMDPRA/ICT/001` — ICT Department, asset 001
- `NMDPRA/FIN/012` — Finance, asset 012
- `NMDPRA/OPS/003` — Operations, asset 003

---

## Depreciation Method
The system uses **Straight-Line Depreciation**:

```
Annual Depreciation = Purchase Cost ÷ Useful Life (Years)
Accumulated Depreciation = Annual Depreciation × Years Used
Net Book Value = Purchase Cost − Accumulated Depreciation
```

This is the standard method used in Nigerian public sector fixed asset accounting.

---

## Database
SQLite database stored at `instance/nmdpra_itam.db`.
To reset: delete this file and restart the app.

---

## Tech Stack
- **Backend**: Python / Flask
- **Database**: SQLite (via SQLAlchemy ORM)
- **Frontend**: Plain HTML/CSS (no JavaScript frameworks needed)
- **Fonts**: IBM Plex Sans (Google Fonts)

---

*Built for NMDPRA Finance Department — NYSC Corps Member Project*
