from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_learning_path():
    return {"message": "Learning path endpoint"}
