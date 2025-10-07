document.addEventListener('DOMContentLoaded', function() {
    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewEvent();
        });
        // Live character counter for description (if present)
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

    // Combine date and time into an ISO-like local datetime string
    // new Date(date + 'T' + time) could be affected by timezone; we send local date/time as YYYY-MM-DDTHH:MM
    const eventDateTime = `${date}T${time}`;

    const eventData = {
        name: name,
        event_date: eventDateTime,
        description: document.getElementById('eventDescription').value.trim(),
        location: location
    };

    // Получаем токен из localStorage и добавляем заголовок Authorization
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
            // Try to parse error JSON if provided
            return response.json().then(err => {
                throw new Error(err.message || `Ошибка сервера: ${response.status}`);
            }).catch(() => {
                throw new Error(`Ошибка сервера: ${response.status}`);
            });
        }
        // Response is OK — attempt to read JSON, but tolerate non-JSON bodies
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
            // Redirect to event details (event-details.js can try to read from sessionStorage or URL)
            window.location.href = 'event-details.html';
        } else {
            // If data is missing or indicates an error, log and do not show intrusive alert
            console.error('Error creating event:', data);
        }
    })
    .catch(error => {
        // Suppress noisy 'Failed to fetch' alert; log for debugging instead
        console.error('Create event failed:', error);
        // Optionally, show a subtle message in the page instead of alert (omitted to keep UX clean)
    });
}