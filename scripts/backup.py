from __future__ import annotations
import shutil
from datetime import datetime
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = root / 'data'
backup_dir = root / 'backups'
backup_dir.mkdir(exist_ok=True)
stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
archive_base = backup_dir / f'hamza-os-backup-{stamp}'
if not data.exists():
    raise SystemExit('No data folder found yet.')
result = shutil.make_archive(str(archive_base), 'zip', data)
print(result)
