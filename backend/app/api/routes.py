
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
import os, uuid, aiofiles, json
from celery.result import AsyncResult
from app.celery_app import celery_app
from app.settings import settings

import redis.asyncio as redis

router = APIRouter()


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    features: str = Form("[]"),
    effects: str = Form("[]")
):
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


# WebSocket 路由：用于前端监听任务完成推送
@router.websocket("/ws/notify")
async def websocket_notify(websocket: WebSocket):
    await websocket.accept()
    redis_kwargs = {
        'host': settings.redis_host,
        'port': settings.redis_port,
        'decode_responses': True
    }
    if settings.redis_password:
        redis_kwargs['password'] = settings.redis_password
    redis_client = redis.Redis(**redis_kwargs)
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("nova:task_done")
    try:
        async for message in pubsub.listen():
            if message['type'] == 'message':
                await websocket.send_text(message['data'])
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe("nova:task_done")
        await pubsub.close()
        await redis_client.close()


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
