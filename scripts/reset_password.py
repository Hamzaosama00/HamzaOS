from __future__ import annotations
import getpass
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.main import connect, set_config, password_hash, init_db, audit

password = getpass.getpass('New HAMZA OS admin password: ')
if len(password) < 8:
    raise SystemExit('Password must be at least 8 characters.')
confirm = getpass.getpass('Confirm password: ')
if password != confirm:
    raise SystemExit('Passwords do not match.')
init_db()
with connect() as conn:
    set_config(conn, 'admin_password_hash', password_hash(password))
audit('auth.password_reset_cli')
print('Password reset complete.')
