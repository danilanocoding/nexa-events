document.addEventListener('DOMContentLoaded', function () {
    const API_BASE = 'http://127.0.0.1:5000';

    
    let eventId = sessionStorage.getItem('currentEventId');
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        const qEvent = params.get('event');
            if (qEvent) {
            eventId = qEvent;
            sessionStorage.setItem('currentEventId', eventId);
        }
    }

    if (!eventId) {
        alert('Мероприятие не найдено!');
        window.location.href = 'organizer.html';
        return;
    }

    
    (function loadEvent() {
        const primary = `${API_BASE}/api/events/${encodeURIComponent(eventId)}`;
        const fallback = `http://localhost:5000/api/events/${encodeURIComponent(eventId)}`;

        fetch(primary)
            .then((res) => {
                if (res.status === 404) return fetch(fallback);
                return res;
            })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === 'ok') {
                    displayEventInfo(data);
                    loadParticipants();
                } else {
                    throw new Error(data.message || 'Ошибка загрузки мероприятия');
                }
            })
            .catch((err) => {
                console.error('Ошибка загрузки мероприятия:', err);
                const main = document.querySelector('main.container');
                if (main) {
                    main.innerHTML = `
                        <div class="text-center mt-5">
                            <h3>Не удалось загрузить мероприятие</h3>
                            <p class="text-muted">${err.message || ''}</p>
                            <a href="organizer.html" class="btn btn-primary mt-3">Вернуться на панель организатора</a>
                        </div>`;
                }
            });
    })();

    
    initCopyButtons();
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToExcel);

    const publishBtn = document.getElementById('publishBtn');
    function setPublishState(isPublished) {
        if (!publishBtn) return;
        if (isPublished) {
            publishBtn.classList.remove('btn-secondary');
            publishBtn.classList.add('btn-success');
            publishBtn.textContent = 'Опубликовано';
        } else {
            publishBtn.classList.remove('btn-success');
            publishBtn.classList.add('btn-secondary');
            publishBtn.textContent = 'Не опубликована';
        }
    }

    if (publishBtn) {
        publishBtn.addEventListener('click', function () {
            const token = localStorage.getItem('token');
            if (!token) {
                showAlert('Требуется авторизация. Пожалуйста, войдите.');
                window.location.href = 'organizer.html';
                return;
            }
            const currentlyPublished = publishBtn.classList.contains('btn-success');
            const publish = !currentlyPublished;

            fetch(`${API_BASE}/api/events/${encodeURIComponent(eventId)}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ publish }),
            })
                .then((r) => r.json())
                .then((data) => {
                    if (data.status === 'ok') {
                        setPublishState(publish);
                        showAlert(publish ? 'Мероприятие опубликовано' : 'Публикация снята');
                    } else {
                        throw new Error(data.message || 'Ошибка публикации');
                    }
                })
                .catch((err) => {
                    console.error('Publish error:', err);
                    showAlert('Ошибка: ' + (err.message || 'не удалось изменить публикацию'));
                });
        });
    }

    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    document.getElementById('deleteBtn').addEventListener('click', () => deleteModal.show());

    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Требуется авторизация. Пожалуйста, войдите.');
            return;
        }

        fetch(`${API_BASE}/api/events/${encodeURIComponent(eventId)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.status === 'ok') {
                    sessionStorage.removeItem('currentEventId');
                    deleteModal.hide();
                    const mainCard = document.querySelector('.event-details-card');
                    if (mainCard) mainCard.remove();
                    const actionsCard = document.querySelectorAll('.event-details-card')[1];
                    if (actionsCard) actionsCard.remove();
                    const container = document.querySelector('main.container');
                    if (container) {
                        const note = document.createElement('div');
                        note.className = 'text-center mt-5';
                        note.innerHTML = `
                            <h3>Мероприятие удалено</h3>
                            <p class="text-muted">Мероприятие успешно удалено.</p>
                            <a href="organizer.html" class="btn btn-primary mt-3">Вернуться на панель организатора</a>
                        `;
                        container.appendChild(note);
                    }
                } else {
                    showAlert('Ошибка при удалении');
                }
            })
            .catch((err) => {
                console.error('Ошибка при удалении:', err);
                showAlert('Ошибка при удалении: ' + (err.message || 'неизвестная ошибка'));
            });
    });

    function displayEventInfo(event) {
        document.getElementById('eventTitle').textContent = event.name;
        document.getElementById('eventDateTime').textContent = `Дата: ${formatDate(event.event_date)}`;
        document.getElementById('eventLocation').textContent = `Место: ${event.location || 'Не указано'}`;
        document.getElementById('eventDescription').innerHTML = formatDescription(event.description);
        document.getElementById('eventCode').value = eventId;
        document.getElementById('publishToggle').checked = !!event.published;
        if (typeof setPublishState === 'function') setPublishState(!!event.published);

    const registrationLink = new URL(`event-registration.html?event=${encodeURIComponent(eventId)}`, window.location.href).href;
    document.getElementById('eventLink').value = registrationLink;
    generateQR(registrationLink);
    }

    function formatDescription(text) {
        if (!text) return 'Описание отсутствует';
        return text
            .split(/\n\s*\n/)
            .map((p) => `<p>${p.trim()}</p>`)
            .join('');
    }

    function loadParticipants() {
        fetch(`${API_BASE}/api/participants/${encodeURIComponent(eventId)}`)
            .then((res) => {
                if (!res.ok) throw new Error('Ошибка загрузки участников');
                return res.json();
            })
            .then((participants) => displayParticipants(participants))
            .catch((err) => {
                console.error('Ошибка загрузки участников:', err);
                const table = document.getElementById('participantsTable');
                if (table) table.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Ошибка загрузки данных</td></tr>';
            });
    }

    function exportToExcel() {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Требуется авторизация. Пожалуйста, войдите.');
            return;
        }

        fetch(`${API_BASE}/api/export/${encodeURIComponent(eventId)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Ошибка экспорта');
                return res.blob();
            })
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `export_${eventId}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch((err) => showAlert('Ошибка: ' + err.message));
    }

    function formatDate(dateString) {
        if (!dateString) return 'Дата не указана';
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    }

    function initCopyButtons() {
        try {
            new ClipboardJS('#copyCodeBtn', { text: () => document.getElementById('eventCode').value });
            new ClipboardJS('#copyLinkBtn', { text: () => document.getElementById('eventLink').value });
        } catch (e) {
        }

        const copyCodeBtn = document.getElementById('copyCodeBtn');
        if (copyCodeBtn) copyCodeBtn.addEventListener('click', () => showAlert('Код скопирован!'));
        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) copyLinkBtn.addEventListener('click', () => showAlert('Ссылка скопирована!'));
    }

    function showAlert(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 2000);
    }
});