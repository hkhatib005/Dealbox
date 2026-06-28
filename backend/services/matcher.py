from database import db
from models.property import Property, PropertyMatch
from models.buybox import BuyBox

def match_properties_to_buybox(buybox):
    """Match all existing properties to a buy box"""
    properties = Property.query.filter_by(active=True).all()
    new_matches = 0
    for prop in properties:
        if _is_match(prop, buybox):
            existing = PropertyMatch.query.filter_by(
                buybox_id=buybox.id, property_id=prop.id
            ).first()
            if not existing:
                match = PropertyMatch(buybox_id=buybox.id, property_id=prop.id)
                db.session.add(match)
                new_matches += 1
    db.session.commit()
    return new_matches

def match_property_to_all_buyboxes(prop):
    """When a new property is added, match it to all buy boxes"""
    buyboxes = BuyBox.query.filter_by(active=True).all()
    new_matches = 0
    for buybox in buyboxes:
        if _is_match(prop, buybox):
            existing = PropertyMatch.query.filter_by(
                buybox_id=buybox.id, property_id=prop.id
            ).first()
            if not existing:
                match = PropertyMatch(buybox_id=buybox.id, property_id=prop.id)
                db.session.add(match)
                new_matches += 1
    db.session.commit()
    return new_matches

def _is_match(prop, buybox):
    """Check if a property matches a buy box criteria"""
    # Price check
    if prop.price:
        if buybox.min_price and prop.price < buybox.min_price:
            return False
        if buybox.max_price and prop.price > buybox.max_price:
            return False

    # Beds check
    if prop.beds:
        if buybox.min_beds and prop.beds < buybox.min_beds:
            return False
        if buybox.max_beds and prop.beds > buybox.max_beds:
            return False

    # Baths check
    if prop.baths and buybox.min_baths:
        if prop.baths < buybox.min_baths:
            return False

    # Zip code check
    if buybox.zip_codes:
        zips = [z.strip() for z in buybox.zip_codes.split(',') if z.strip()]
        if zips and prop.zip_code and prop.zip_code not in zips:
            return False

    # State check
    if buybox.states:
        states = [s.strip().upper() for s in buybox.states.split(',') if s.strip()]
        if states and prop.state and prop.state.upper() not in states:
            return False

    # Property type check
    if buybox.property_types and prop.property_type:
        types = [t.strip() for t in buybox.property_types.split(',') if t.strip()]
        if types and prop.property_type not in types:
            return False

    # Deal type check
    if buybox.deal_types and prop.deal_type:
        deal_types = [d.strip() for d in buybox.deal_types.split(',') if d.strip()]
        if deal_types and prop.deal_type not in deal_types:
            return False

    return True
