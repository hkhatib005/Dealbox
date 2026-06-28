from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import db
from routes.auth import auth_bp
from routes.buybox import buybox_bp
from routes.properties import properties_bp
from routes.admin import admin_bp
import os

def create_app():
    app = Flask(__name__)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dealbox.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET', 'dealbox-secret-key-change-in-prod')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False

    CORS(app, origins=['http://localhost:5173', 'http://localhost:3000'], supports_credentials=True)
    JWTManager(app)
    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(buybox_bp, url_prefix='/api/buybox')
    app.register_blueprint(properties_bp, url_prefix='/api/properties')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    with app.app_context():
        db.create_all()
        seed_admin()

    return app

def seed_admin():
    from models.user import User
    from werkzeug.security import generate_password_hash
    if not User.query.filter_by(email='admin@dealbox.com').first():
        admin = User(
            name='Admin',
            email='admin@dealbox.com',
            password=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin seeded: admin@dealbox.com / admin123")

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
