from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
import os, uuid, aiofiles
from celery.result import AsyncResult
from app.celery_app import celery_app

router = APIRouter()

@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    features: str = Form("[]"),
    effects: str = Form("[]")
):
    import json
    task_id = str(uuid.uuid4())
    upload_path = f"storage/uploads/{task_id}.mp4"
    async with aiofiles.open(upload_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    features_list = json.loads(features)
    effects_list = json.loads(effects)

    task = celery_app.send_task("app.tasks.video.tasks.process_video", args=[{
        "task_id": task_id,
        "upload_path": upload_path,
        "features": features_list,
        "effects": effects_list
    }])
    return {"task_id": task.id}

@router.get("/status/{task_id}")
def get_status(task_id: str):
    res = AsyncResult(task_id, app=celery_app)
    return {"status": res.status, "result": res.result if res.ready() else None}

@router.get("/result/{task_id}")
def get_result(task_id: str):
    path = f"storage/outputs/{task_id}.mp4"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Result not ready")
    return FileResponse(path, media_type="video/mp4", filename=f"processed_{task_id}.mp4")
