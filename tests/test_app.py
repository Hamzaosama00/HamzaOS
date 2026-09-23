import os
import tempfile
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Configure app before importing it.
os.environ['DEMO_MODE'] = '1'
os.environ['DATA_DIR'] = tempfile.mkdtemp(prefix='hamza-os-test-')
os.environ['ALLOWED_HOSTS'] = 'testserver,localhost,127.0.0.1'
os.environ['OLLAMA_BASE_URL'] = 'http://127.0.0.1:11434'
os.environ['OLLAMA_MODEL'] = 'llama3.1'

from fastapi.testclient import TestClient
from app.main import app, init_db, save_api_key_value, saved_api_key, password_hash, verify_password

client = TestClient(app)


def setup_module():
    init_db()


def test_healthz():
    r = client.get('/healthz')
    assert r.status_code == 200
    assert r.json()['ok'] is True


def test_auth_status_demo():
    r = client.get('/api/auth/status')
    assert r.status_code == 200
    assert r.json()['authenticated'] is True


def test_state_creates_plan():
    r = client.get('/api/state')
    assert r.status_code == 200
    data = r.json()
    assert data['profile']['name'] == 'Hamza'
    assert len(data['tasks']) >= 5
    assert data['plan']['source'] in {'starter', 'Ollama'}


def test_task_toggle_and_checkin():
    state = client.get('/api/state').json()
    task_id = state['tasks'][0]['id']
    r = client.post('/api/task', json={'id': task_id, 'done': True})
    assert r.status_code == 200
    r = client.post('/api/checkin', json={'sleep_hours': 8.5, 'energy': 4, 'mood': 'Good', 'notes': 'Test note'})
    assert r.status_code == 200
    new_state = client.get('/api/state').json()
    assert new_state['checkin']['energy'] == 4


def test_profile_update():
    payload = {'name':'Hamza Pro','height_cm':130,'weight_kg':40,'wake_time':'07:30','sleep_time':'22:15','focus':'fitness','note':'test'}
    r = client.post('/api/profile', json=payload)
    assert r.status_code == 200
    data = client.get('/api/state').json()
    assert data['profile']['name'] == 'Hamza Pro'


def test_key_vault_roundtrip():
    save_api_key_value('abc.DEF_123456789')
    assert saved_api_key() == 'abc.DEF_123456789'


def test_password_hash():
    h = password_hash('very-secure-password')
    assert verify_password('very-secure-password', h)
    assert not verify_password('wrong-password', h)


def test_export():
    r = client.get('/api/export')
    assert r.status_code == 200
    assert 'profile' in r.json()
