import subprocess
from celery import shared_task
import os
import random
import json

from app.utils.video_utils import get_video_duration, get_video_resolution
from app.settings import settings

import redis

@shared_task
def process_video(task: dict):
    input_path = task["upload_path"]
    output_path = f"storage/outputs/{task['task_id']}.mp4"
    cmd = ["ffmpeg", "-i", input_path]

    features = task.get("features")
    if features:
        print("Processing features:", features)

        if "mirrorflip" in features:
            cmd += ["-vf", "hflip"]

        if "md5" in features:
            cmd += ["-metadata", "comment=md5_patch"]

        if "breakoffbothends" in features:
            duration = get_video_duration(input_path)
            start = 3
            end = max(duration - 3, start + 0.1)
            cmd += ["-ss", str(start), "-to", str(end)]

        if "randomrotation" in features:
            angle = random.choice([2, -2])
            zoom_ratio = 1.1
            
            width, height = get_video_resolution(input_path)
            radians = angle * 3.14159265 / 180
            vf = (
                f"rotate={radians}:ow=rotw({radians}):oh=roth({radians}):c=black," \
                f"scale=iw*{zoom_ratio}:ih*{zoom_ratio}," \
                f"crop={width}:{height}:(in_w-{width})/2:(in_h-{height})/2"
            )
            cmd += ["-vf", vf]


    effects = task.get("effects")
    if effects:
        print("Processing effects:", effects)

        if "light" in effects:
            width, height = get_video_resolution(input_path)
            if width >= height:
                sweep_dir = "storage/effects/light/h"
            else:
                sweep_dir = "storage/effects/light/v"
            sweep_files = [f for f in os.listdir(sweep_dir) if f.endswith((".mp4", ".mov", ".avi"))]
            if not sweep_files:
                raise RuntimeError(f"No sweep light video found in {sweep_dir}")
            sweep_video = os.path.join(sweep_dir, random.choice(sweep_files))
            sweep_opacity = 0.02
            filter_complex = (
                f"[1:v]format=rgba,scale={width}:{height},"
                f"colorchannelmixer=aa={sweep_opacity}[light];"
                f"[0:v][light]overlay=0:0"
            )
            cmd = [
                "ffmpeg",
                "-i", input_path,
                "-stream_loop", "-1", "-i", sweep_video,
                "-filter_complex", filter_complex,
                "-map", "0:a?",
                "-c:v", "libx264",
                "-c:a", "copy",
                "-shortest",
                "-y",
                output_path
            ]
            subprocess.run(cmd, check=True)
            _notify_task_done(task, output_path)
            return output_path

    cmd += [output_path]
    subprocess.run(cmd, check=True)
    _notify_task_done(task, output_path)
    return output_path


def _notify_task_done(task, output_path):
    try:
        redis_kwargs = {
            'host': settings.redis_host,
            'port': settings.redis_port,
            'db': 0
        }
        if settings.redis_password:
            redis_kwargs['password'] = settings.redis_password
        r = redis.Redis(**redis_kwargs)
        notify_data = {
            "task_id": task.get("task_id"),
            "status": "SUCCESS",
            "result": {"output_path": output_path}
        }
        r.publish('nova:task_done', json.dumps(notify_data))
    except Exception as e:
        print(f"[Notify] Redis publish failed: {e}")
