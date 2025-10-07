#config.py
import os
import secrets

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
SECRET_KEY = secrets.token_hex(32)

class Config:
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'database.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = SECRET_KEY
