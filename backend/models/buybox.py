from database import db
from datetime import datetime

class BuyBox(db.Model):
    __tablename__ = 'buyboxes'
    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name           = db.Column(db.String(100), default='My Buy Box')
    zip_codes      = db.Column(db.Text)
    states         = db.Column(db.Text)
    min_price      = db.Column(db.Integer, default=0)
    max_price      = db.Column(db.Integer, default=500000)
    min_beds       = db.Column(db.Integer, default=2)
    max_beds       = db.Column(db.Integer, default=5)
    min_baths      = db.Column(db.Float, default=1)
    property_types = db.Column(db.Text, default='Single Family')
    conditions     = db.Column(db.Text, default='Distressed,Fair,Good')
    deal_types     = db.Column(db.Text, default='Probate,Foreclosure,Tax Delinquent,Absentee')
    active         = db.Column(db.Boolean, default=True)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)
    matches        = db.relationship('PropertyMatch', backref='buybox', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'zip_codes':      self.zip_codes.split(',') if self.zip_codes else [],
            'states':         self.states.split(',') if self.states else [],
            'min_price':      self.min_price,
            'max_price':      self.max_price,
            'min_beds':       self.min_beds,
            'max_beds':       self.max_beds,
            'min_baths':      self.min_baths,
            'property_types': self.property_types.split(',') if self.property_types else [],
            'conditions':     self.conditions.split(',') if self.conditions else [],
            'deal_types':     self.deal_types.split(',') if self.deal_types else [],
            'active':         self.active,
            'created_at':     self.created_at.isoformat(),
            'match_count':    len(self.matches)
        }
