import random
import string
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models.user import User
from models.buybox import BuyBox
from models.property import Property, PropertyMatch
from models.invite_code import InviteCode
from services.matcher import match_property_to_all_buyboxes

admin_bp = Blueprint('admin', __name__)

def _require_admin():
    user = User.query.get(int(get_jwt_identity()))
    if not user or user.role != 'admin':
        return None, (jsonify({'error': 'Admin access required'}), 403)
    return user, None

def _gen_code(length=10):
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(chars, k=length))
        if not InviteCode.query.filter_by(code=code).first():
            return code

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    _, err = _require_admin()
    if err: return err

    result = []
    for u in User.query.all():
        d = u.to_dict()
        d['buybox_count']  = len(u.buyboxes)
        d['total_matches'] = sum(len(b.matches) for b in u.buyboxes)
        d['buyboxes']      = [b.to_dict() for b in u.buyboxes]
        result.append(d)
    return jsonify(result), 200

@admin_bp.route('/users/pending', methods=['GET'])
@jwt_required()
def get_pending_users():
    _, err = _require_admin()
    if err: return err
    pending = User.query.filter_by(role='wholesaler', approved=False).order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in pending]), 200

@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
@jwt_required()
def approve_user(user_id):
    _, err = _require_admin()
    if err: return err
    user = User.query.get_or_404(user_id)
    user.approved = True
    db.session.commit()
    return jsonify({'message': f'{user.name} approved', 'user': user.to_dict()}), 200

@admin_bp.route('/users/<int:user_id>/suspend', methods=['POST'])
@jwt_required()
def suspend_user(user_id):
    _, err = _require_admin()
    if err: return err
    user = User.query.get_or_404(user_id)
    if user.role == 'admin':
        return jsonify({'error': 'Cannot suspend admin'}), 400
    user.approved = False
    db.session.commit()
    return jsonify({'message': f'{user.name} suspended', 'user': user.to_dict()}), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    _, err = _require_admin()
    if err: return err
    user = User.query.get_or_404(user_id)
    if user.role == 'admin':
        return jsonify({'error': 'Cannot delete admin'}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User removed'}), 200

@admin_bp.route('/buyboxes', methods=['GET'])
@jwt_required()
def get_all_buyboxes():
    _, err = _require_admin()
    if err: return err

    result = []
    for b in BuyBox.query.all():
        d = b.to_dict()
        d['user'] = b.user.to_dict() if b.user else None
        result.append(d)
    return jsonify(result), 200

@admin_bp.route('/properties', methods=['GET'])
@jwt_required()
def get_all_properties():
    _, err = _require_admin()
    if err: return err
    return jsonify([p.to_dict() for p in Property.query.filter_by(active=True).order_by(Property.created_at.desc()).all()]), 200

@admin_bp.route('/properties', methods=['POST'])
@jwt_required()
def add_property():
    _, err = _require_admin()
    if err: return err

    data = request.get_json()
    prop = Property(
        address=data['address'], city=data.get('city'), state=data.get('state'),
        zip_code=data.get('zip_code'), price=data.get('price'), beds=data.get('beds'),
        baths=data.get('baths'), sqft=data.get('sqft'),
        property_type=data.get('property_type', 'Single Family'),
        condition=data.get('condition', 'Distressed'),
        deal_type=data.get('deal_type', 'Foreclosure'),
        owner_name=data.get('owner_name'), description=data.get('description'),
        lat=data.get('lat'), lng=data.get('lng'),
        source=data.get('source', 'Manual'), source_url=data.get('source_url'),
        arv_estimate=data.get('arv_estimate')
    )
    db.session.add(prop)
    db.session.commit()
    match_property_to_all_buyboxes(prop)
    return jsonify(prop.to_dict()), 201

@admin_bp.route('/properties/<int:prop_id>', methods=['DELETE'])
@jwt_required()
def delete_property(prop_id):
    _, err = _require_admin()
    if err: return err
    prop = Property.query.get_or_404(prop_id)
    prop.active = False
    db.session.commit()
    return jsonify({'message': 'Removed'}), 200

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def admin_stats():
    _, err = _require_admin()
    if err: return err
    return jsonify({
        'total_users':       User.query.filter_by(role='wholesaler').count(),
        'pending_approvals': User.query.filter_by(role='wholesaler', approved=False).count(),
        'total_buyboxes':    BuyBox.query.count(),
        'total_properties':  Property.query.filter_by(active=True).count(),
        'total_matches':     PropertyMatch.query.count(),
        'active_buyboxes':   BuyBox.query.filter_by(active=True).count(),
    }), 200

# ── Invite Codes ───────────────────────────────────────────────────────────────

@admin_bp.route('/invite-codes', methods=['GET'])
@jwt_required()
def get_invite_codes():
    _, err = _require_admin()
    if err: return err
    codes = InviteCode.query.order_by(InviteCode.created_at.desc()).all()
    return jsonify([c.to_dict() for c in codes]), 200

@admin_bp.route('/invite-codes', methods=['POST'])
@jwt_required()
def create_invite_code():
    admin, err = _require_admin()
    if err: return err
    code = InviteCode(code=_gen_code(), created_by=admin.id)
    db.session.add(code)
    db.session.commit()
    return jsonify(code.to_dict()), 201

@admin_bp.route('/invite-codes/<int:code_id>', methods=['DELETE'])
@jwt_required()
def deactivate_invite_code(code_id):
    _, err = _require_admin()
    if err: return err
    code = InviteCode.query.get_or_404(code_id)
    code.active = False
    db.session.commit()
    return jsonify({'message': 'Code deactivated'}), 200
