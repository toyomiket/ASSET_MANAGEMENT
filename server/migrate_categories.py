"""
migrate_categories.py
Run this ONCE from the server/ folder:  python3 migrate_categories.py
It remaps old categories to the 6 official NMDPRA categories.
"""
import sqlite3

DB = 'instance/nmdpra_itam.db'

MAPPING = {
    # Old                  New                       Life
    'Computer/Laptop':    ('Office Equipment',        5),
    'Desktop Computer':   ('Office Equipment',        5),
    'Printer':            ('Office Equipment',        5),
    'Photocopier':        ('Office Equipment',        5),
    'Audio/Visual':       ('Office Equipment',        5),
    'Networking':         ('Office Equipment',        5),
    'Furniture':          ('Furniture and Fittings',  5),
    'Vehicle':            ('Motor Vehicle',           4),
    'Generator':          ('Plant and Machinery',     5),
    'Security Equipment': ('Plant and Machinery',     5),
}

conn = sqlite3.connect(DB)
total = 0
for old, (new, life) in MAPPING.items():
    cur = conn.execute(
        "UPDATE asset SET category=?, useful_life_years=? WHERE category=?",
        (new, life, old)
    )
    if cur.rowcount:
        print(f'  {old:<25} → {new}  ({cur.rowcount} assets)')
        total += cur.rowcount

conn.commit()
print(f'\nDone. {total} assets updated.')

# Summary
print('\nCategory counts after migration:')
for row in conn.execute('SELECT category, COUNT(*) FROM asset GROUP BY category ORDER BY category'):
    print(f'  {row[0]:<25} {row[1]} assets')

conn.close()
