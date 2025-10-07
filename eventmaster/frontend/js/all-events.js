document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchEvents');
    let allEvents = [];

    // Загрузка всех мероприятий
    fetch('http://localhost:5000/api/events/published')
        .then(response => response.json())
        .then(events => {
            allEvents = events;
            displayEvents(events);

            // Добавляем обработчик поиска
            searchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const filteredEvents = allEvents.filter(event => 
                    event.name.toLowerCase().includes(searchTerm)
                );
                displayEvents(filteredEvents);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ошибка при загрузке мероприятий');
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
                        <button class="btn btn-primary register-btn" data-event-code="${event.event_code}">
                            Зарегистрироваться
                        </button>
                    </div>
                </div>
            `;
            eventsListContainer.appendChild(eventCard);
        });

        // Добавляем обработчики для кнопок регистрации
        document.querySelectorAll('.register-btn').forEach(button => {
            button.addEventListener('click', function() {
                const eventCode = this.dataset.eventCode;
                window.location.href = `event-registration.html?event=${eventCode}`;
            });
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
});