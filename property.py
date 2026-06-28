from database import db
from datetime import datetime

class Property(db.Model):
    __tablename__ = 'properties'
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100))
    state = db.Column(db.String(10))
    zip_code = db.Column(db.String(10))
    price = db.Column(db.Integer)
    beds = db.Column(db.Integer)
    baths = db.Column(db.Float)
    sqft = db.Column(db.Integer)
    property_type = db.Column(db.String(50), default='Single Family')
    condition = db.Column(db.String(50))
    deal_type = db.Column(db.String(50))  # Probate, Foreclosure, Tax Delinquent, etc
    owner_name = db.Column(db.String(100))
    description = db.Column(db.Text)
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    source = db.Column(db.String(100))    # HUD, Fannie Mae, County, etc
    source_url = db.Column(db.String(500))
    image_url = db.Column(db.String(500))
    days_on_market = db.Column(db.Integer, default=0)
    arv_estimate = db.Column(db.Integer)  # After Repair Value
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    matches = db.relationship('PropertyMatch', backref='property', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'price': self.price,
            'beds': self.beds,
            'baths': self.baths,
            'sqft': self.sqft,
            'property_type': self.property_type,
            'condition': self.condition,
            'deal_type': self.deal_type,
            'owner_name': self.owner_name,
            'description': self.description,
            'lat': self.lat,
            'lng': self.lng,
            'source': self.source,
            'source_url': self.source_url,
            'image_url': self.image_url,
            'days_on_market': self.days_on_market,
            'arv_estimate': self.arv_estimate,
            'active': self.active,
            'created_at': self.created_at.isoformat()
        }


class PropertyMatch(db.Model):
    __tablename__ = 'property_matches'
    id = db.Column(db.Integer, primary_key=True)
    buybox_id = db.Column(db.Integer, db.ForeignKey('buyboxes.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    seen = db.Column(db.Boolean, default=False)
    saved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        prop = self.property.to_dict() if self.property else {}
        return {
            'id': self.id,
            'buybox_id': self.buybox_id,
            'property_id': self.property_id,
            'seen': self.seen,
            'saved': self.saved,
            'created_at': self.created_at.isoformat(),
            'property': prop
        }
