from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models.property import Property, PropertyMatch
from models.buybox import BuyBox
from models.user import User
from services.scraper import run_scrapers

properties_bp = Blueprint('properties', __name__)

def _require_approved():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return None, (jsonify({'error': 'User not found'}), 404)
    if user.role != 'admin' and not user.approved:
        return None, (jsonify({'error': 'Account pending approval', 'pending': True}), 403)
    return user, None

@properties_bp.route('/', methods=['GET'])
@jwt_required()
def get_properties():
    user, err = _require_approved()
    if err: return err
    user_id = int(get_jwt_identity())

    page      = request.args.get('page', 1, type=int)
    per_page  = request.args.get('per_page', 20, type=int)
    deal_type = request.args.get('deal_type')
    state     = request.args.get('state')
    min_price = request.args.get('min_price', type=int)
    max_price = request.args.get('max_price', type=int)

    query = Property.query.filter_by(active=True)
    if deal_type:  query = query.filter(Property.deal_type == deal_type)
    if state:      query = query.filter(Property.state == state)
    if min_price:  query = query.filter(Property.price >= min_price)
    if max_price:  query = query.filter(Property.price <= max_price)

    if user.role != 'admin':
        user_boxes = BuyBox.query.filter_by(user_id=user_id, active=True).all()
        if user_boxes:
            matched_ids = [m[0] for m in db.session.query(PropertyMatch.property_id).filter(
                PropertyMatch.buybox_id.in_([b.id for b in user_boxes])
            ).all()]
            if matched_ids:
                query = query.filter(Property.id.in_(matched_ids))
            else:
                return jsonify({'properties': [], 'total': 0, 'pages': 0}), 200

    result = query.order_by(Property.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        'properties': [p.to_dict() for p in result.items],
        'total': result.total,
        'pages': result.pages,
        'page': page
    }), 200



@properties_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_properties():
    user = User.query.get(int(get_jwt_identity()))
    if user.role != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    count = run_scrapers()
    return jsonify({'message': f'Scraped {count} new properties'}), 200

@properties_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user, err = _require_approved()
    if err: return err
    user_id = int(get_jwt_identity())

    if user.role == 'admin':
        by_type = db.session.query(Property.deal_type, db.func.count(Property.id))\
            .filter_by(active=True).group_by(Property.deal_type).all()
        return jsonify({
            'total_properties': Property.query.filter_by(active=True).count(),
            'by_deal_type': [{'type': t, 'count': c} for t, c in by_type],
            'total_users': User.query.count(),
            'total_buyboxes': BuyBox.query.count()
        }), 200

    boxes = BuyBox.query.filter_by(user_id=user_id).all()
    return jsonify({
        'total_buyboxes': len(boxes),
        'total_matches': sum(len(b.matches) for b in boxes),
        'new_matches': sum(1 for b in boxes for m in b.matches if not m.seen),
        'saved_deals': PropertyMatch.query.join(BuyBox).filter(
            BuyBox.user_id == user_id, PropertyMatch.saved == True
        ).count()
    }), 200
