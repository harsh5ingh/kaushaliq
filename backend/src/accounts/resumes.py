"""Bounded local text extraction; no external processing and no canonical skill inference."""
import io
import re
import zipfile
import xml.etree.ElementTree as ET
import json
import subprocess
import sys
from pathlib import Path
from pypdf import PdfReader
from fastapi import HTTPException
from src.config import settings


def storage():
    path = Path(settings.resume_storage_path)
    if not path.is_absolute(): path = Path(settings.auth_database_path).parent / 'private-resumes'
    path.mkdir(parents=True, exist_ok=True)
    return path.resolve()


def file_path(identifier):
    if not re.fullmatch(r'[a-f0-9]{32}',identifier): raise HTTPException(404,'not_found')
    return storage() / identifier


def extract_isolated(data, media_type):
    """Terminate pathological parsing after ten seconds; capture diagnostics privately."""
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'src.accounts.resume_worker', media_type],
            input=data, capture_output=True, timeout=10, check=True,
            cwd=Path(__file__).resolve().parents[2],
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0,
        )
        return json.loads(result.stdout)
    except Exception:
        raise HTTPException(422, 'resume_invalid') from None


def extract(data, media_type):
    try:
        if media_type == 'application/pdf':
            if not data.startswith(b'%PDF-') or re.search(rb'/Length\s+(\d{8,})\b',data): raise ValueError()
            reader = PdfReader(io.BytesIO(data))
            if reader.is_encrypted or len(reader.pages)>20: raise ValueError()
            text = '\n'.join((page.extract_text() or '')[:20000] for page in reader.pages)
        elif media_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            if not data.startswith(b'PK\x03\x04'): raise ValueError()
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                entries = archive.infolist()
                if len(entries)>300 or sum(e.file_size for e in entries)>10*1024*1024 or any(e.filename.lower().endswith('vbaproject.bin') for e in entries): raise ValueError()
                xml = archive.read('word/document.xml')
                if b'<!DOCTYPE' in xml or b'<!ENTITY' in xml: raise ValueError()
                root = ET.fromstring(xml)
                text = '\n'.join(''.join(p.itertext()) for p in root.iter() if p.tag.endswith('}p'))[:400000]
        else: raise ValueError()
    except Exception:
        raise HTTPException(422,'resume_invalid') from None
    # Only explicitly labelled resume sections; no guessed competency ontology/verification.
    candidates = {'skills':[], 'education':[], 'experience':[]}
    active = None
    headings = {'skills':'skills','technical skills':'skills','education':'education','qualifications':'education','experience':'experience','work experience':'experience'}
    for line in text.splitlines():
        line = line.strip()
        label, _, content = line.partition(':')
        if label.lower() in headings:
            active = headings[label.lower()]
            line = content.strip()
        elif line.lower() in {'projects','summary','contact','certifications','references'}:
            active = None
        if active and line:
            values = re.split(r'[,;|]',line) if active=='skills' else [line]
            candidates[active].extend(v.strip()[:100] for v in values if v.strip())
    candidates = {key:list(dict.fromkeys(values))[:20] for key,values in candidates.items()}
    return {**candidates,'text_available':bool(text.strip())}
