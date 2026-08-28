"""
app.py — Entry point. Wires everything together.
"""
from flask import Flask
from flask_cors import CORS
from db import init_db, migrate_db, seed, seed_extra
from views import views_bp
from api import api_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = 'nmdpra-itam-secret-2024'

# Allow the React dev server to call the API directly
CORS(
    app,
    origins=["http://localhost:3000", "https://asset-0005.netlify.app”],
    supports_credentials=True,
)

app.register_blueprint(views_bp)
app.register_blueprint(api_bp)

if __name__ == '__main__':
    init_db()
    migrate_db()
    seed()
    seed_extra()
    app.run(debug=True)
