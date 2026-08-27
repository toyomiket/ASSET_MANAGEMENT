"""
db.py — Database connection, schema, migrations, and seed data.
"""
import sqlite3, os
from contextlib import contextmanager
from datetime import date

DB = 'instance/nmdpra_itam.db'
os.makedirs('instance', exist_ok=True)


@contextmanager
def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS department (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS asset (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            tag_number        TEXT UNIQUE NOT NULL,
            name              TEXT NOT NULL,
            category          TEXT NOT NULL,
            brand             TEXT,
            model             TEXT,
            serial_number     TEXT,
            purchase_date     TEXT NOT NULL,
            purchase_cost     REAL NOT NULL,
            useful_life_years INTEGER DEFAULT 5,
            department_id     INTEGER NOT NULL REFERENCES department(id),
            assigned_to       TEXT,
            location          TEXT,
            status            TEXT DEFAULT 'Active',
            condition         TEXT DEFAULT 'Good',
            notes             TEXT,
            description       TEXT,
            manufacturer      TEXT,
            date_added        TEXT DEFAULT (date('now')),
            created_at        TEXT DEFAULT (datetime('now')),
            updated_at        TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS maintenance_log (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id     INTEGER NOT NULL REFERENCES asset(id) ON DELETE CASCADE,
            date         TEXT NOT NULL,
            description  TEXT NOT NULL,
            cost         REAL DEFAULT 0,
            performed_by TEXT
        );

        CREATE TABLE IF NOT EXISTS disposal_log (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id        INTEGER NOT NULL REFERENCES asset(id) ON DELETE CASCADE,
            disposal_date   TEXT NOT NULL,
            reason          TEXT NOT NULL,
            method          TEXT NOT NULL,
            proceeds        REAL DEFAULT 0,
            notes           TEXT,
            created_at      TEXT DEFAULT (datetime('now'))
        );
        """)


def migrate_db():
    """Apply any schema changes to existing databases."""
    with get_db() as db:
        cols = [row[1] for row in db.execute("PRAGMA table_info(asset)").fetchall()]
        if 'date_added' not in cols:
            db.execute("ALTER TABLE asset ADD COLUMN date_added TEXT")
            db.execute("UPDATE asset SET date_added = date(created_at) WHERE date_added IS NULL")
        if 'description' not in cols:
            db.execute("ALTER TABLE asset ADD COLUMN description TEXT")
        if 'manufacturer' not in cols:
            db.execute("ALTER TABLE asset ADD COLUMN manufacturer TEXT")

        # Create disposal_log table if it doesn't exist
        db.execute("""
            CREATE TABLE IF NOT EXISTS disposal_log (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id        INTEGER NOT NULL REFERENCES asset(id) ON DELETE CASCADE,
                disposal_date   TEXT NOT NULL,
                reason          TEXT NOT NULL,
                method          TEXT NOT NULL,
                proceeds        REAL DEFAULT 0,
                notes           TEXT,
                created_at      TEXT DEFAULT (datetime('now'))
            )
        """)


def seed():
    with get_db() as db:
        if db.execute("SELECT COUNT(*) FROM department").fetchone()[0] == 0:
            for name in [
                'Finance & Accounts', 'ICT Department', 'Legal Services',
                'Human Resources', 'Operations & Technical', 'Executive Office',
                'Procurement', 'Internal Audit'
            ]:
                db.execute("INSERT INTO department (name) VALUES (?)", (name,))

        if db.execute("SELECT COUNT(*) FROM asset").fetchone()[0] == 0:
            samples = [
                ('NMDPRA/ICT/001','Dell Latitude 5520 Laptop','Office Equipment','Dell','Latitude 5520','SN-DL552001','2022-03-15',650000,5,2,'Adaeze Okonkwo','ICT Office','Active','Good','2022-03-16'),
                ('NMDPRA/ICT/002','HP LaserJet Pro Printer','Office Equipment','HP','LaserJet Pro M404n','SN-HP40401','2021-06-01',185000,5,2,'ICT Department','ICT Office','Active','Good','2021-06-03'),
                ('NMDPRA/FIN/001','HP EliteBook 840 Laptop','Office Equipment','HP','EliteBook 840','SN-HP84001','2021-01-20',580000,5,1,'Chukwuemeka Eze','Finance Office','Active','Fair','2021-01-22'),
                ('NMDPRA/FIN/002','Canon Photocopier','Office Equipment','Canon','iR2625','SN-CN26251','2020-08-10',950000,5,1,'Finance Department','Finance Office','Active','Good','2020-08-12'),
                ('NMDPRA/EXE/001','Executive Office Chair','Furniture and Fittings','Herman Miller','Aeron',None,'2023-01-05',420000,5,6,'Director General','Executive Suite','Active','Good','2023-01-06'),
                ('NMDPRA/OPS/001','Toyota Hilux Pickup','Motor Vehicle','Toyota','Hilux 2.8L','SN-TH28001','2021-11-30',18500000,4,5,'Operations Pool','Car Park','Active','Good','2021-12-01'),
                ('NMDPRA/ICT/003','Cisco Network Switch','Office Equipment','Cisco','Catalyst 2960','SN-CS29601','2020-04-22',380000,5,2,'Server Room','ICT Server Room','Active','Good','2020-04-24'),
                ('NMDPRA/HR/001','Biometric Attendance System','Plant and Machinery','ZKTeco','F18','SN-ZK1801','2022-09-14',210000,5,4,'HR Department','Main Entrance','Active','Good','2022-09-15'),
            ]
            for s in samples:
                db.execute("""
                    INSERT INTO asset (tag_number,name,category,brand,model,serial_number,
                        purchase_date,purchase_cost,useful_life_years,department_id,
                        assigned_to,location,status,condition,date_added)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, s)


def seed_extra():
    """Add extra dummy assets to existing departments. Safe to run multiple times."""
    extra = [
        ('NMDPRA/FIN/003','Lenovo ThinkPad E14 Laptop','Office Equipment','Lenovo','ThinkPad E14','SN-LV14001','2023-02-10',720000,5,1,'Ngozi Adeyemi','Finance Office','Active','Good','2023-02-11'),
        ('NMDPRA/FIN/004','Standing Meeting Table','Furniture and Fittings','Tisco',None,None,'2021-04-05',185000,5,1,'Finance Department','Finance Conference Room','Active','Good','2021-04-06'),
        ('NMDPRA/FIN/005','Epson EcoTank Printer','Office Equipment','Epson','EcoTank L5290','SN-EP52901','2022-07-18',145000,5,1,'Finance Department','Finance Office','Active','Good','2022-07-19'),
        ('NMDPRA/ICT/004','Dell OptiPlex Desktop','Office Equipment','Dell','OptiPlex 7090','SN-DL70901','2021-08-20',480000,5,2,'Emeka Nwosu','ICT Office','Active','Good','2021-08-21'),
        ('NMDPRA/ICT/005','APC UPS 3000VA','Plant and Machinery','APC','Smart-UPS 3000','SN-APC30001','2020-11-12',320000,5,2,'Server Room','ICT Server Room','Active','Fair','2020-11-13'),
        ('NMDPRA/ICT/006','HP ProBook Laptop','Office Equipment','HP','ProBook 450','SN-HP45001','2023-05-30',610000,5,2,'Fatima Bello','ICT Office','Active','Good','2023-05-31'),
        ('NMDPRA/ICT/007','Projector Epson EB-X51','Office Equipment','Epson','EB-X51','SN-EPBX511','2022-01-14',280000,5,2,'ICT Department','Conference Room','Active','Good','2022-01-15'),
        ('NMDPRA/LEG/001','HP EliteBook 850 Laptop','Office Equipment','HP','EliteBook 850','SN-HP85001','2022-06-01',695000,5,3,'Barrister Aminu Sule','Legal Office','Active','Good','2022-06-02'),
        ('NMDPRA/LEG/002','Legal Document Scanner','Office Equipment','Fujitsu','ScanSnap iX1600','SN-FJ16001','2021-09-20',195000,5,3,'Legal Department','Legal Office','Active','Good','2021-09-21'),
        ('NMDPRA/LEG/003','Office Bookshelf (6-tier)','Furniture and Fittings','Ofix',None,None,'2020-03-10',65000,5,3,'Legal Department','Legal Library','Active','Fair','2020-03-11'),
        ('NMDPRA/HR/002','Dell Inspiron Laptop','Office Equipment','Dell','Inspiron 15','SN-DL15001','2023-01-09',540000,5,4,'Blessing Okafor','HR Office','Active','Good','2023-01-10'),
        ('NMDPRA/HR/003','Intercom Telephone System','Office Equipment','Panasonic','KX-TGE432','SN-PN43201','2021-07-22',125000,5,4,'HR Department','HR Office','Active','Good','2021-07-23'),
        ('NMDPRA/HR/004','Office Reception Chairs (set)','Furniture and Fittings','Unique',None,None,'2022-10-05',210000,5,4,'HR Department','Reception Area','Active','Good','2022-10-06'),
        ('NMDPRA/OPS/002','Honda Generator 10KVA','Plant and Machinery','Honda','EP10000','SN-HD10001','2020-06-15',1850000,5,5,'Operations Pool','Generator House','Active','Fair','2020-06-16'),
        ('NMDPRA/OPS/003','Toyota Corolla Sedan','Motor Vehicle','Toyota','Corolla 1.8L','SN-TC18001','2022-04-28',12500000,4,5,'Operations Pool','Car Park','Active','Good','2022-04-29'),
        ('NMDPRA/OPS/004','Industrial Air Compressor','Plant and Machinery','Atlas Copco','GA15','SN-AC15001','2019-11-05',2750000,5,5,'Technical Team','Workshop','Under Repair','Fair','2019-11-06'),
        ('NMDPRA/OPS/005','Pressure Measurement Kit','Plant and Machinery','Fluke','700G Series','SN-FL700G1','2021-03-17',385000,5,5,'Technical Team','Workshop','Active','Good','2021-03-18'),
        ('NMDPRA/EXE/002','MacBook Pro 14-inch','Office Equipment','Apple','MacBook Pro M2','SN-AP14001','2023-03-20',1850000,5,6,'DG Personal Assistant','Executive Office','Active','Good','2023-03-21'),
        ('NMDPRA/EXE/003','55-inch Smart Conference TV','Office Equipment','Samsung','QN55Q80C','SN-SM55001','2022-08-11',980000,5,6,'Executive Office','Board Room','Active','Good','2022-08-12'),
        ('NMDPRA/EXE/004','Executive Desk (L-Shaped)','Furniture and Fittings','Neka',None,None,'2021-05-03',350000,5,6,'Director General','Executive Suite','Active','Good','2021-05-04'),
        ('NMDPRA/PRO/001','HP Desktop Computer','Office Equipment','HP','EliteDesk 800','SN-HP80001','2022-02-14',420000,5,7,'Procurement Officer','Procurement Office','Active','Good','2022-02-15'),
        ('NMDPRA/PRO/002','Heavy Duty Paper Shredder','Office Equipment','Fellowes','Powershred 99Ci','SN-FW99001','2021-10-30',145000,5,7,'Procurement Department','Procurement Office','Active','Good','2021-10-31'),
        ('NMDPRA/AUD/001','Lenovo IdeaPad Laptop','Office Equipment','Lenovo','IdeaPad 3','SN-LV30001','2022-11-07',490000,5,8,'Audit Officer','Audit Office','Active','Good','2022-11-08'),
        ('NMDPRA/AUD/002','Canon DSLR Camera','Office Equipment','Canon','EOS 2000D','SN-CN20001','2021-12-15',320000,5,8,'Audit Department','Audit Office','Active','Good','2021-12-16'),
        ('NMDPRA/AUD/003','Filing Cabinet (4-drawer)','Furniture and Fittings','Bisley',None,None,'2020-09-22',95000,5,8,'Audit Department','Audit Office','Active','Fair','2020-09-23'),
    ]
    with get_db() as db:
        existing = {row[0] for row in db.execute("SELECT tag_number FROM asset").fetchall()}
        for s in extra:
            if s[0] not in existing:
                db.execute("""
                    INSERT INTO asset (tag_number,name,category,brand,model,serial_number,
                        purchase_date,purchase_cost,useful_life_years,department_id,
                        assigned_to,location,status,condition,date_added)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, s)
