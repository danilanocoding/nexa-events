from flask import Blueprint, jsonify
from models import Event, Participant

participants_api_bp = Blueprint('participants_api', __name__)


@participants_api_bp.route('/participants/<event_code>', methods=['GET'])
def get_participants(event_code):
    event = Event.query.filter_by(event_code=event_code).first()
    if not event:
        return jsonify({'status': 'error', 'message': 'Мероприятие не найдено'}), 404

    participants = Participant.query.filter_by(event_id=event.id).all()
    result = []
    for p in participants:
        result.append({
            'id': p.id,
            'full_name': p.full_name,
            'group': p.group,
            'visited': bool(p.visited),
            'unique_code': p.unique_code
        })

    return jsonify(result)
