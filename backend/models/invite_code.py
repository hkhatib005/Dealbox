from database import db
from datetime import datetime

class InviteCode(db.Model):
    __tablename__ = 'invite_codes'
    id         = db.Column(db.Integer, primary_key=True)
    code       = db.Column(db.String(20), unique=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    used_by    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    used_at    = db.Column(db.DateTime, nullable=True)
    active     = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by], backref='created_codes')
    redeemer = db.relationship('User', foreign_keys=[used_by])

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'created_by': self.creator.name if self.creator else None,
            'used_by': self.redeemer.name if self.redeemer else None,
            'used_at': self.used_at.isoformat() if self.used_at else None,
            'active': self.active,
            'created_at': self.created_at.isoformat()
        }
