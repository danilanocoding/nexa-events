from flask import Blueprint, request, jsonify
from models import db, Organizer
import jwt
from datetime import datetime, timedelta
from functools import wraps
from config import SECRET_KEY

auth_bp = Blueprint('auth', __name__)

def create_token(organizer_id):
    token = jwt.encode({
        'organizer_id': organizer_id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }, SECRET_KEY, algorithm='HS256')
    return token

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'status': 'error', 'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]  # Remove "Bearer" prefix
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_organizer = Organizer.query.get(data['organizer_id'])
        except:
            return jsonify({'status': 'error', 'message': 'Invalid token'}), 401
        return f(current_organizer, *args, **kwargs)
    return decorated

@auth_bp.route('/organizers/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not all(k in data for k in ['name', 'email', 'password']):
        return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
    
    if Organizer.query.filter_by(email=data['email']).first():
        return jsonify({'status': 'error', 'message': 'Email already registered'}), 400
    
    organizer = Organizer(name=data['name'], email=data['email'])
    organizer.set_password(data['password'])
    
    db.session.add(organizer)
    try:
        db.session.commit()
        return jsonify({'status': 'ok', 'message': 'Successfully registered'})
    except:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': 'Error registering user'}), 500

@auth_bp.route('/organizers/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'status': 'error', 'message': 'Missing email or password'}), 400
    
    organizer = Organizer.query.filter_by(email=data['email']).first()
    
    if not organizer or not organizer.check_password(data['password']):
        return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401
    
    token = create_token(organizer.id)
    return jsonify({
        'status': 'ok',
        'token': token,
        'organizerId': organizer.id,
        'name': organizer.name
    })

@auth_bp.route('/organizers/verify', methods=['GET'])
@token_required
def verify_token(current_organizer):
    return jsonify({
        'status': 'ok',
        'organizerId': current_organizer.id,
        'name': current_organizer.name
    })