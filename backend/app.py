import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import db

def create_app():
    app = Flask(__name__)

    # ── Database ───────────────────────────────────────────────────────────────
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///dealbox.db')
    # Render gives postgres://, SQLAlchemy needs postgresql://
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)

    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # ── Auth ───────────────────────────────────────────────────────────────────
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET', 'dealbox-change-in-prod')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False

    # ── CORS ───────────────────────────────────────────────────────────────────
    raw_origins = os.environ.get(
        'ALLOWED_ORIGINS',
        'http://localhost:5173,http://localhost:3000'
    )
    origins = [o.strip() for o in raw_origins.split(',') if o.strip()]
    CORS(app, origins=origins, supports_credentials=True)

    JWTManager(app)
    db.init_app(app)

    # ── Blueprints ─────────────────────────────────────────────────────────────
    from routes.auth import auth_bp
    from routes.buybox import buybox_bp
    from routes.properties import properties_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp,        url_prefix='/api/auth')
    app.register_blueprint(buybox_bp,      url_prefix='/api/buybox')
    app.register_blueprint(properties_bp,  url_prefix='/api/properties')
    app.register_blueprint(admin_bp,       url_prefix='/api/admin')

    with app.app_context():
        db.create_all()
        _seed_admin()
        _seed_properties()

    return app

def _seed_admin():
    from models.user import User
    from werkzeug.security import generate_password_hash
    if not User.query.filter_by(email='admin@dealbox.com').first():
        db.session.add(User(
            name='Admin',
            email='admin@dealbox.com',
            password=generate_password_hash('admin123'),
            role='admin'
        ))
        db.session.commit()
        print('✅ Admin seeded: admin@dealbox.com / admin123')

def _seed_properties():
    from services.scraper import seed_demo_properties
    seed_demo_properties()
