# Nexa Events — инструкция по запуску

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

Если нужно, могу подготовить Dockerfile и docker-compose.
