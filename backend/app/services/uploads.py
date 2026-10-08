import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

UPLOAD_ROOT = Path("uploads")
IMAGES_DIR = UPLOAD_ROOT / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_BYTES = 5 * 1024 * 1024  # 5MB


async def save_image(file: UploadFile) -> str:
    """Validates and saves an uploaded image, returning its public URL path
    (served by the StaticFiles mount in main.py)."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only JPEG, PNG or WebP images are allowed")

    body = await file.read()
    if len(body) > MAX_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image must be 5MB or smaller")
    if len(body) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file")

    # Trust the file's actual bytes, not just the client-supplied Content-Type
    # header — this is what's served back to every viewer, so a mislabeled
    # upload could otherwise be used to smuggle non-image content.
    is_jpeg = body[:3] == b"\xff\xd8\xff"
    is_png = body[:8] == b"\x89PNG\r\n\x1a\n"
    is_webp = body[:4] == b"RIFF" and body[8:12] == b"WEBP"
    if not (is_jpeg or is_png or is_webp):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File content doesn't match an image type")

    ext = ALLOWED_TYPES[file.content_type]
    filename = f"{uuid.uuid4().hex}.{ext}"
    (IMAGES_DIR / filename).write_bytes(body)

    return f"/api/v1/uploads/images/{filename}"
