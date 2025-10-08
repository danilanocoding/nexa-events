document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchEvents');
    let allEvents = [];
    const token = localStorage.getItem('token');

    function showInlineAlert(message, type = 'danger', timeout = 0) {
        const existing = document.getElementById('inlineAlert');
        if (existing) existing.remove();
        const container = document.querySelector('main.container');
        if (!container) return;
        const alert = document.createElement('div');
        alert.id = 'inlineAlert';
        alert.className = `alert alert-${type} text-center`;
        alert.style.marginBottom = '1rem';
        alert.textContent = message;
        container.prepend(alert);
        if (timeout > 0) setTimeout(() => alert.remove(), timeout);
    }

    const fetchOptions = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
    const endpoint = token ? 'http://localhost:5000/api/events/all' : 'http://localhost:5000/api/events/published';
    fetch(endpoint, fetchOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(events => {
        if (!token) {
            events = events.map(e => ({ ...e, published: true }));
        }
        allEvents = events;
        displayEvents(events);

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredEvents = allEvents.filter(event => 
                event.name.toLowerCase().includes(searchTerm)
            );
            displayEvents(filteredEvents);
        });
    })
    .catch(error => {
        console.error('Error loading events:', error);
        showInlineAlert('Ошибка при загрузке мероприятий. Попробуйте обновить страницу.');
    });

    function displayEvents(events) {
        const eventsListContainer = document.getElementById('eventsList');
        eventsListContainer.innerHTML = '';

        if (events.length === 0) {
            eventsListContainer.innerHTML = '<div class="col-12 text-center"><p>Мероприятия не найдены</p></div>';
            return;
        }

        events.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'col';
            eventCard.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${event.name}</h5>
                        <p class="card-text text-muted mb-2">🗓️ ${formatDate(event.event_date)}</p>
                        <p class="card-text text-muted">📍 ${event.location || 'Не указано'}</p>
                        <p class="card-text">${event.description || 'Описание отсутствует'}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="d-flex align-items-center" style="gap:8px;">
                                <button class="btn btn-primary view-btn" data-event-code="${event.event_code}">Просмотр</button>
                                <button class="btn btn-${event.published ? 'success' : 'secondary'} publish-btn" 
                                    data-event-code="${event.event_code}" 
                                    data-published="${event.published}">
                                    ${event.published ? 'Опубликовано' : 'Не опубликовано'}
                                </button>
                            </div>
                            <button class="btn btn-danger delete-btn" data-event-code="${event.event_code}">Удалить</button>
                        </div>
                    </div>
                </div>
            `;
            eventsListContainer.appendChild(eventCard);
        });

        addEventHandlers();
    }

    function addEventHandlers() {
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function() {
                    const eventCode = this.dataset.eventCode;
                    try { sessionStorage.setItem('currentEventId', eventCode); } catch (e) { /* ignore */ }
                    window.location.href = `event-details.html?event=${encodeURIComponent(eventCode)}`;
                });
        });

        document.querySelectorAll('.publish-btn').forEach(button => {
            button.addEventListener('click', function() {
                const eventCode = this.dataset.eventCode;
                const currentlyPublished = this.dataset.published === 'true';
                togglePublish(eventCode, !currentlyPublished, this);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const eventCode = this.dataset.eventCode;
                const deleteModalEl = document.getElementById('deleteModal');
                deleteModalEl.dataset.eventCode = eventCode;
                const deleteModal = new bootstrap.Modal(deleteModalEl);
                deleteModal.show();
            });
        });
    }

    function togglePublish(eventCode, publish, button) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Требуется вход организатора, чтобы изменить статус публикации');
            return;
        }

        fetch(`http://localhost:5000/api/events/${eventCode}/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ publish })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                button.textContent = publish ? 'Опубликовано' : 'Не опубликовано';
                button.classList.remove(publish ? 'btn-secondary' : 'btn-success');
                button.classList.add(publish ? 'btn-success' : 'btn-secondary');
                button.dataset.published = publish;
            } else {
                throw new Error(data.message || 'Ошибка при изменении статуса публикации');
            }
        })
        .catch(error => {
            alert(error.message);
        });
    }

    function deleteEvent(eventCode) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Требуется вход организатора, чтобы удалить мероприятие');
            return;
        }
        fetch(`http://localhost:5000/api/events/${eventCode}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка сервера при удалении: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'ok') {
                allEvents = allEvents.filter(e => e.event_code !== eventCode);
                displayEvents(allEvents);
                showInlineAlert('Мероприятие успешно удалено.', 'success', 3000);
            } else {
                throw new Error(data.message || 'Ошибка при удалении мероприятия');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            showInlineAlert(error.message || 'Ошибка при удалении мероприятия');
        });
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(',', ' в');
    }

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            const deleteModalEl = document.getElementById('deleteModal');
            const code = deleteModalEl ? deleteModalEl.dataset.eventCode : null;
            if (code) {
                deleteEvent(code);
                const modalInstance = bootstrap.Modal.getInstance(deleteModalEl);
                if (modalInstance) modalInstance.hide();
            }
        });
    }
});
