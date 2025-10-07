document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы форм
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const organizerPanel = document.getElementById('organizer-panel');

    // Проверяем авторизацию
    checkAuth();

    // Обработчики переключения между формами
    showRegisterLink.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    });

    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    });

    // Обработка формы входа
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        fetch('http://localhost:5000/api/organizers/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                localStorage.setItem('token', data.token);
                localStorage.setItem('organizerId', data.organizerId);
                showOrganizerPanel();
            } else {
                alert(data.message || 'Ошибка входа');
            }
        })
        .catch(error => {
            alert('Ошибка при попытке входа');
            console.error('Error:', error);
        });
    });

    // Обработка формы регистрации
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        fetch('http://localhost:5000/api/organizers/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        })
        .then(response => response.json())
        .then(data => {
                if (data.status === 'ok') {
                    // Show styled in-page success message and switch to login form
                    showMessage('Регистрация успешна! Теперь вы можете войти.', 'success');
                    // after a short delay switch to login so user sees the message
                    setTimeout(() => showLoginLink.click(), 800);
                } else {
                    alert(data.message || 'Ошибка регистрации');
                }
        })
        .catch(error => {
            alert('Ошибка при попытке регистрации');
            console.error('Error:', error);
        });
    });

        // Helper: show a styled in-page alert inside #auth-container
        function showMessage(message, type = 'success') {
            // remove existing alert if any
            const existing = document.getElementById('auth-alert');
            if (existing) existing.remove();
            const alert = document.createElement('div');
            alert.id = 'auth-alert';
            alert.className = `alert alert-${type} rounded-pill text-center`;
            alert.style.margin = '0 0 1rem 0';
            alert.style.fontWeight = '600';
            alert.textContent = message;
            const container = document.getElementById('auth-container');
            // insert at top so it is immediately visible
            container.insertBefore(alert, container.firstChild);
            // auto-remove after 4s
            setTimeout(() => {
                if (alert.parentNode) alert.remove();
            }, 4000);
        }
    function checkAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('http://localhost:5000/api/organizers/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    showOrganizerPanel();
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('organizerId');
                }
            })
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('organizerId');
            });
        }
    }

    function showOrganizerPanel() {
        document.getElementById('auth-container').style.display = 'none';
        organizerPanel.classList.remove('d-none');
    }
});