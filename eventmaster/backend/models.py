#models.py
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Organizer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200))
    events = db.relationship('Event', backref='organizer', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200))
    event_date = db.Column(db.String(50))
    location = db.Column(db.String(255))
    description = db.Column(db.String(1000))
    additional_info = db.Column(db.String(255))
    event_code = db.Column(db.String(20), unique=True)
    published = db.Column(db.Boolean, default=False) 
    organizer_id = db.Column(db.Integer, db.ForeignKey('organizer.id'), nullable=False)
    participants = db.relationship('Participant', backref='event', lazy=True)

class Participant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(300))
    group = db.Column(db.String(50))
    unique_code = db.Column(db.String(20), unique=True)
    visited = db.Column(db.Boolean, default=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=True)
