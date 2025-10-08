# Nexa-Events — инструкция по запуску

Ниже шаги для запуска проекта на Windows (PowerShell). Инструкция предполагает, что у вас установлен Python 3.10+.

1) Установите Python

- Скачайте и установите Python 3.10 или новее с https://www.python.org/downloads/.
- Во время установки отметьте "Add Python to PATH".

2) Создайте и активируйте виртуальное окружение

```powershell
cd "C:\Users\Админ\Desktop\nexa-events\eventmaster"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3) Установите зависимости

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

4) Переменные окружения (опционально)

Файл `backend/config.py` генерирует SECRET_KEY автоматически. По умолчанию используется SQLite файл `backend/database.db`.
Если хотите использовать свой ключ, можете экспортировать переменную окружения перед запуском (необязательно):

```powershell
$env:SECRET_KEY = "ваш_секретный_ключ"
```

5) Запуск приложения

```powershell
cd backend
python server.py
```

По умолчанию Flask запустится в режиме отладки и будет доступен по адресу http://127.0.0.1:5000

6) Тестирование API

- Регистрация организатора: POST /api/organizers/register
- Логин: POST /api/organizers/login
- Создание мероприятия: POST /api/events/create (требует Authorization: Bearer <token>)
- Регистрация участника: POST /api/register
- Экспорт участников: GET /api/export/<event_code>

7) Частые проблемы

- Ошибка отсутствия модуля: убедитесь, что виртуальное окружение активировано и зависимости установлены.
- Проблемы с правами записи для `backend/database.db`: запустите PowerShell с правами, позволяющими запись в папку, или переместите проект в папку пользователя.
- На Windows иногда требуется включить выполнение скриптов PowerShell для активации venv: выполните

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

8) Дополнительно

Если вы хотите запустить проект в продакшне, не используйте встроенный сервер Flask — разверните через gunicorn/Uvicorn + reverse-proxy (nginx) или Azure/GCP/Heroku и настройте конфигурацию SECRET_KEY и БД.

---------------------

Flask>=2.2
Flask-Cors
Flask-SQLAlchemy
PyJWT
qrcode
Pillow
openpyxl

---------------------

# Описание решения — Nexa-Events

Ниже краткое техописание проекта, его архитектуры, данных и рекомендаций — чтобы руководители могли быстро понять назначение и важные детали.

1) Краткое описание

Проект представляет собой простое веб-приложение для управления мероприятиями и участниками. Бэкенд реализован на Flask и предоставляет REST API для регистрации организаторов, создания и публикации мероприятий, регистрации участников, отметки посещения и экспорта участников в Excel. Хранилище по умолчанию — SQLite (`backend/database.db`).

2) Технологии и зависимости

- Python 3.10+
- Flask, Flask-Cors, Flask-SQLAlchemy
- PyJWT для JWT-аутентификации
- qrcode + Pillow для генерации QR-кодов участников
- openpyxl для экспорта в XLSX

Файл зависимостей: `requirements.txt`.

3) Структура проекта (ключевые файлы)

- `backend/server.py` — точка входа приложения, регистрация blueprint'ов и инициализация БД.
- `backend/config.py` — конфигурация (URI SQLite, SECRET_KEY генерируется автоматически).
- `backend/models.py` — модели SQLAlchemy: Organizer, Event, Participant.
- `backend/routes/` — набор маршрутов API: auth, events, participants, participants_api, export.
- `frontend/` — статические HTML/CSS/JS файлы интерфейса (если используются).

4) Основные модели данных (кратко)

- Organizer: id, name, email(unique), password_hash
- Event: id, name, event_date, location, description, additional_info, event_code(unique), published, organizer_id
- Participant: id, full_name, group, unique_code(unique), visited, event_id

5) Основные эндпойнты (выборка)

- POST `/api/organizers/register` — регистрация организатора
- POST `/api/organizers/login` — логин, возвращает JWT
- POST `/api/events/create` — создать мероприятие (требует Bearer token)
- POST `/api/register` — регистрация участника, возвращает уникальный код и QR (base64)
- POST `/api/scan` — отметить участника как пришедшего
- GET `/api/export/<event_code>` — скачать xlsx участников

6) Контракт и поведение API

- Входные данные: JSON в теле POST-запросов. Для защищённых маршрутов — заголовок `Authorization: Bearer <token>`.
- Выход: JSON с полями `status` (ok/error) и данными или сообщение об ошибке. Экспорт возвращает файл xlsx.
- Типовые коды ошибок: 400 (bad request), 401 (auth), 404 (not found), 500 (server error).

7) Поток работы (high-level)

1. Организатор регистрируется и логинится -> получает JWT.
2. Организатор создаёт мероприятие -> генерируется `event_code` и сохраняется Event.
3. Участник регистрируется по `event_code` -> создаётся Participant с `unique_code`; сервер генерирует QR и возвращает его в base64.
4. При сканировании QR frontend отправляет `unique_code` + `event_code` -> сервер помечает `visited=True`.
5. Экспорт генерирует xlsx с листами "Все участники", "Пришли", "Не пришли".

8) Замечания по безопасности и эксплуатации

- В `config.py` SECRET_KEY генерируется при старте — для продакшн среды нужно явно задавать постоянный ключ через переменные окружения.
- JWT имеет срок жизни 1 день; для продакшна следует продумать refresh tokens.
- SQLite подходит для прототипа или малого количества пользователей; рассмотреть PostgreSQL для продакшна.

9) Риски и edge-cases

- Коллизии сгенерированных кодов (event_code, unique_code) — сейчас используются случайные числа; лучше использовать UUID или проверять уникальность в цикле.
- Проблемы с правами записи на файл `database.db` на Windows — могут помешать созданию/изменению БД.
- Нет миграций БД (используется `db.create_all()`), что усложнит изменения схемы на живой базе.





