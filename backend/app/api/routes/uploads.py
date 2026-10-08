from fastapi import APIRouter, Depends, UploadFile

from app.api.deps import get_current_staff
from app.models.staff_user import StaffUser
from app.services.uploads import save_image

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/images")
async def upload_image(file: UploadFile, staff: StaffUser = Depends(get_current_staff)):
    url = await save_image(file)
    return {"url": url}
