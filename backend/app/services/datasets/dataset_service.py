import os
import uuid
from typing import Tuple

import pandas as pd
from fastapi import UploadFile

# Follows the existing convention of app/uploads/<category>/ used by the
# Postman/OpenAPI upload feature (see app/api/upload.py).
UPLOAD_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "app", "uploads", "datasets")
UPLOAD_ROOT = os.path.abspath(UPLOAD_ROOT)

ALLOWED_EXTENSIONS = {".csv": "csv", ".xlsx": "xlsx", ".xls": "xls"}


def ensure_upload_dir() -> None:
    os.makedirs(UPLOAD_ROOT, exist_ok=True)


def validate_extension(filename: str) -> str:
    """Returns the normalized file_type or raises ValueError if unsupported."""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type '{ext}'. Only .csv, .xlsx, and .xls are supported.")
    return ALLOWED_EXTENSIONS[ext]


async def save_upload(file: UploadFile, file_type: str) -> Tuple[str, str, int]:
    """
    Streams the upload to disk. Returns (stored_filename, absolute_path, size_bytes).
    """
    ensure_upload_dir()
    stored_filename = f"{uuid.uuid4().hex}.{file_type}"
    absolute_path = os.path.join(UPLOAD_ROOT, stored_filename)

    size_bytes = 0
    with open(absolute_path, "wb") as out_file:
        while chunk := await file.read(1024 * 1024):
            out_file.write(chunk)
            size_bytes += len(chunk)

    return stored_filename, absolute_path, size_bytes


def extract_basic_metadata(file_path: str, file_type: str) -> Tuple[int, int]:
    """
    Reads the file with pandas just to count rows/columns.
    Raises on unreadable/corrupt files so the caller can mark status='failed'.
    """
    if file_type == "csv":
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    return len(df), len(df.columns)


def delete_file(file_path: str) -> None:
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
