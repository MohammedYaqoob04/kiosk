"""Upload validation and storage. Files are kept in the database (table stored_files)."""
import re
from urllib.parse import quote
from pathlib import Path

from fastapi import Response
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import StoredFile

# (magic bytes) -> (content type, extension)
_SIGNATURES = [
    (b"%PDF-", "application/pdf", "pdf"),
    (b"\xff\xd8\xff", "image/jpeg", "jpg"),
    (b"\x89PNG\r\n\x1a\n", "image/png", "png"),
]


class UploadError(ValueError):
    pass


def sniff(data: bytes) -> tuple[str, str]:
    for magic, ctype, ext in _SIGNATURES:
        if data.startswith(magic):
            return ctype, ext
    raise UploadError("Only PDF, JPG and PNG files are allowed.")


def clean_filename(name: str | None, ext: str) -> str:
    base = Path(name or "file").name  # drop any path
    base = re.sub(r"[^\w.\- ]", "_", base).strip(" .") or "file"
    stem = Path(base).stem[:80] or "file"
    return f"{stem}.{ext}"


def validate_upload(filename: str | None, data: bytes) -> tuple[str, str, str]:
    """Returns (clean_filename, content_type, extension). The type is decided by the file's bytes,
    never by the name or the browser's claim."""
    if not data:
        raise UploadError("The file is empty.")
    if len(data) > get_settings().max_upload_bytes:
        raise UploadError(f"Each file must be {get_settings().max_upload_bytes // (1024 * 1024)} MB or smaller.")
    ctype, ext = sniff(data)
    return clean_filename(filename, ext), ctype, ext


def store(db: Session, data: bytes, content_type: str) -> int:
    f = StoredFile(content_type=content_type, size_bytes=len(data), data=data)
    db.add(f)
    db.flush()
    return f.id


def file_response(db: Session, file_id: int | None, filename: str) -> Response | None:
    f = db.get(StoredFile, file_id) if file_id else None
    if f is None:
        return None
    ascii_name = filename.encode("ascii", "ignore").decode().replace('"', "") or "file"
    return Response(f.data, media_type=f.content_type, headers={
        "Content-Disposition": f"inline; filename=\"{ascii_name}\"; filename*=UTF-8\'\'{quote(filename)}",
        "X-Content-Type-Options": "nosniff"})
