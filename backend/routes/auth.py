from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from database import db
from models.user import User
from models.invite_code import InviteCode

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    auto_approved = False
    invite_code_str = data.get('invite_code', '').strip().upper()

    if invite_code_str:
        code = InviteCode.query.filter_by(code=invite_code_str, active=True).first()
        if not code or code.used_by:
            return jsonify({'error': 'Invalid or already-used invite code'}), 400
        auto_approved = True

    user = User(
        name=data.get('name', 'Wholesaler'),
        email=data['email'],
        password=generate_password_hash(data['password']),
        phone=data.get('phone', ''),
        role='wholesaler',
        approved=auto_approved
    )
    db.session.add(user)
    db.session.flush()  # get user.id before commit

    if auto_approved and invite_code_str:
        code.used_by = user.id
        code.used_at = datetime.utcnow()
        code.active = False

    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if not user or not check_password_hash(user.password, data.get('password', '')):
        return jsonify({'error': 'Invalid credentials'}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/validate-invite', methods=['POST'])
def validate_invite():
    data = request.get_json()
    code_str = (data.get('code') or '').strip().upper()
    if not code_str:
        return jsonify({'valid': False, 'error': 'No code provided'}), 400
    code = InviteCode.query.filter_by(code=code_str, active=True).first()
    if not code or code.used_by:
        return jsonify({'valid': False, 'error': 'Invalid or already-used invite code'}), 200
    return jsonify({'valid': True}), 200
