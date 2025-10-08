document.addEventListener('DOMContentLoaded', function() {
    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewEvent();
        });
        const desc = document.getElementById('eventDescription');
        const counter = document.getElementById('descCounter');
        if (desc && counter) {
            const update = () => {
                counter.textContent = `${desc.value.length} / ${desc.maxLength}`;
                if (desc.value.length >= desc.maxLength) {
                    counter.classList.add('limit-reached');
                } else {
                    counter.classList.remove('limit-reached');
                }
            };
            desc.addEventListener('input', update);
            update();
        }
    }
});

function createNewEvent() {
    const name = document.getElementById('eventName').value.trim();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime') ? document.getElementById('eventTime').value : '';
    const location = document.getElementById('eventLocation').value.trim();

    if (!name || !date || !time || !location) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    const eventDateTime = `${date}T${time}`;

    const eventData = {
        name: name,
        event_date: eventDateTime,
        description: document.getElementById('eventDescription').value.trim(),
        location: location
    };

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Требуется авторизация организатора. Пожалуйста, войдите в аккаунт организатора.');
        window.location.href = 'organizer.html';
        return;
    }

    fetch('http://localhost:5000/api/events/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || `Ошибка сервера: ${response.status}`);
            }).catch(() => {
                throw new Error(`Ошибка сервера: ${response.status}`);
            });
        }
        return response.text().then(text => {
            if (!text) return { status: 'ok' };
            try {
                return JSON.parse(text);
            } catch (e) {
                console.warn('Create event: response not JSON, continuing', e);
                return { status: 'ok' };
            }
        });
    })
    .then(data => {
        if (data && data.status === 'ok') {
            if (data.event_code) sessionStorage.setItem('currentEventId', data.event_code);
            window.location.href = 'event-details.html';
        } else {
            console.error('Error creating event:', data);
        }
    })
    .catch(error => {
        console.error('Create event failed:', error);
    });
}