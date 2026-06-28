from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models.buybox import BuyBox
from services.matcher import match_properties_to_buybox

buybox_bp = Blueprint('buybox', __name__)

def _list_field(val):
    """Convert comma-string or list to comma-string for storage."""
    if isinstance(val, list):
        return ','.join(str(v).strip() for v in val)
    return val or ''

@buybox_bp.route('/', methods=['GET'])
@jwt_required()
def get_buyboxes():
    user_id = int(get_jwt_identity())
    boxes = BuyBox.query.filter_by(user_id=user_id).order_by(BuyBox.created_at.desc()).all()
    return jsonify([b.to_dict() for b in boxes]), 200

@buybox_bp.route('/', methods=['POST'])
@jwt_required()
def create_buybox():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    box = BuyBox(
        user_id=user_id,
        name=data.get('name', 'My Buy Box'),
        zip_codes=_list_field(data.get('zip_codes')),
        states=_list_field(data.get('states')),
        min_price=data.get('min_price', 0),
        max_price=data.get('max_price', 500000),
        min_beds=data.get('min_beds', 2),
        max_beds=data.get('max_beds', 5),
        min_baths=data.get('min_baths', 1),
        property_types=_list_field(data.get('property_types', ['Single Family'])),
        conditions=_list_field(data.get('conditions', ['Distressed', 'Fair', 'Good'])),
        deal_types=_list_field(data.get('deal_types', ['Probate', 'Foreclosure', 'Tax Delinquent', 'Absentee Owner'])),
    )
    db.session.add(box)
    db.session.commit()

    # Auto-match existing properties
    match_properties_to_buybox(box)

    return jsonify(box.to_dict()), 201

@buybox_bp.route('/<int:box_id>', methods=['PUT'])
@jwt_required()
def update_buybox(box_id):
    user_id = int(get_jwt_identity())
    box = BuyBox.query.filter_by(id=box_id, user_id=user_id).first_or_404()
    data = request.get_json()

    box.name           = data.get('name', box.name)
    box.zip_codes      = _list_field(data.get('zip_codes', box.zip_codes))
    box.states         = _list_field(data.get('states', box.states))
    box.min_price      = data.get('min_price', box.min_price)
    box.max_price      = data.get('max_price', box.max_price)
    box.min_beds       = data.get('min_beds', box.min_beds)
    box.max_beds       = data.get('max_beds', box.max_beds)
    box.min_baths      = data.get('min_baths', box.min_baths)
    box.property_types = _list_field(data.get('property_types', box.property_types))
    box.conditions     = _list_field(data.get('conditions', box.conditions))
    box.deal_types     = _list_field(data.get('deal_types', box.deal_types))
    box.active         = data.get('active', box.active)
    db.session.commit()

    match_properties_to_buybox(box)
    return jsonify(box.to_dict()), 200

@buybox_bp.route('/<int:box_id>', methods=['DELETE'])
@jwt_required()
def delete_buybox(box_id):
    user_id = int(get_jwt_identity())
    box = BuyBox.query.filter_by(id=box_id, user_id=user_id).first_or_404()
    db.session.delete(box)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@buybox_bp.route('/<int:box_id>/matches', methods=['GET'])
@jwt_required()
def get_matches(box_id):
    user_id = int(get_jwt_identity())
    box = BuyBox.query.filter_by(id=box_id, user_id=user_id).first_or_404()
    return jsonify([m.to_dict() for m in box.matches]), 200
