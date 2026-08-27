# NMDPRA ITAM — React Frontend

React + Vite frontend for the NMDPRA IT Asset Management System.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Make sure Flask backend is running
```bash
# In the nmdpra_itam 2 folder:
pip install -r requirements.txt
python app.py
```
Flask runs on http://localhost:5000

### 3. Start the React dev server
```bash
npm run dev
```
Opens at http://localhost:3000

Vite proxies all `/api` requests to Flask automatically (configured in `vite.config.js`).

## Build for Production
```bash
npm run build
```
Output goes to `dist/`. You can serve it statically or configure Flask to serve it.

## Project Structure
```
src/
  api/
    client.js         # All API calls to Flask backend
  components/
    Layout.jsx        # Sidebar + topbar shell
    Shared.jsx        # Reusable: Badge, Money, Loading, ConfirmModal, DepBar
    Toast.jsx         # Global toast notifications
  pages/
    Dashboard.jsx     # Overview with stats
    Assets.jsx        # Asset register with filter/search
    AssetDetail.jsx   # Single asset view + maintenance log
    AssetForm.jsx     # Add / Edit asset form
    Departments.jsx   # Department management
    Reports.jsx       # Depreciation schedule + dept summary
  App.jsx             # Router
  main.jsx            # Entry point
  index.css           # Global styles + design tokens
```
