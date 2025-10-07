#events.py
from flask import Blueprint, request, jsonify
from models import db, Event
from routes.auth import token_required
import random

events_bp = Blueprint('events', __name__)

def generate_event_code():
    return str(random.randint(100000, 999999))

@events_bp.route('/events/create', methods=['POST'])
@token_required
def create_event(current_organizer):
    data = request.json
    name = data.get('name')
    event_date = data.get('event_date')
    description = data.get('description')
    additional_info = data.get('additional_info')
    location = data.get('location')

    code = generate_event_code()

    event = Event(
        name=name,
        event_date=event_date,
        description=description,
        additional_info=additional_info,
        location=location,
        event_code=code,
        organizer_id=current_organizer.id
    )
    db.session.add(event)
    db.session.commit()

    return jsonify({'status': 'ok', 'event_code': code, 'event_id': event.id})


@events_bp.route('/events/<event_code>', methods=['GET'])
def get_event_by_code(event_code):
    event = Event.query.filter_by(event_code=event_code).first()
    if not event:
        return jsonify({'status': 'error', 'message': 'Мероприятие не найдено'}), 404

    return jsonify({
        'status': 'ok',
        'name': event.name,
        'description': event.description,
        'event_date': event.event_date,
        'additional_info': event.additional_info,
        'location': event.location,
        'published': event.published 
    })


@events_bp.route('/events/<event_code>/publish', methods=['POST'])
@token_required
def toggle_publish(current_organizer, event_code):
    event = Event.query.filter_by(event_code=event_code, organizer_id=current_organizer.id).first()
    if not event:
        return jsonify({'status': 'error', 'message': 'Мероприятие не найдено'}), 404

    data = request.json
    publish = data.get('publish')

    if publish is None:
        return jsonify({'status': 'error', 'message': 'Не передан параметр publish'}), 400

    event.published = publish
    db.session.commit()

    return jsonify({'status': 'ok', 'published': event.published})


@events_bp.route('/events/published', methods=['GET'])
def get_published_events():
    events = Event.query.filter_by(published=True).all()
    result = sorted(events, key=lambda e: e.event_date)

    return jsonify([{
        'name': e.name,
        'event_date': e.event_date,
        'location': e.location,
        'description': e.description,
        'event_code': e.event_code
    } for e in result])

@events_bp.route('/events/all', methods=['GET'])
@token_required
def get_all_events(current_organizer):
    # Return events owned by this organizer OR events with no organizer (legacy/unassigned)
    events = Event.query.filter((Event.organizer_id == current_organizer.id) | (Event.organizer_id == None)).all()
    result = sorted(events, key=lambda e: e.event_date)

    return jsonify([{
        'name': e.name,
        'event_date': e.event_date,
        'location': e.location,
        'description': e.description,
        'event_code': e.event_code,
        'published': e.published
    } for e in result])

@events_bp.route('/events/<event_code>', methods=['DELETE'])
@token_required
def delete_event(current_organizer, event_code):
    event = Event.query.filter_by(event_code=event_code, organizer_id=current_organizer.id).first()
    if not event:
        return jsonify({'status': 'error', 'message': 'Мероприятие не найдено'}), 404

    for p in event.participants:
        db.session.delete(p)

    db.session.delete(event)
    db.session.commit()
    return jsonify({'status': 'ok', 'message': 'Мероприятие удалено'})
