import subprocess
from celery import shared_task
import os
import random
import json

from app.utils.video_utils import get_video_duration, get_video_resolution
from app.utils.oss_utils import upload_video_and_get_urls
from app.settings import settings

import redis


@shared_task
def process_video(task: dict):
    """
    主函数：根据任务内容处理视频，支持功能（features）和特效（effects）。
    """
    input_path = task["upload_path"]
    os.makedirs("storage/outputs", exist_ok=True)
    output_path = f"storage/outputs/{task['task_id']}.mp4"

    # Step 1: 处理功能（features），生成中间文件
    temp_path = process_features(task, input_path)

    # Step 2: 处理特效（effects），基于中间文件生成最终输出
    process_effects(task, temp_path, output_path)

    # 如果生成了中间文件，处理完成后删除
    if temp_path != input_path:
        safe_remove(temp_path)
    
    # 上传到OSS
    oss_result = upload_video_and_get_urls(output_path, task["task_id"])
    _notify_task_done(task, output_path, oss_result)
    return output_path


def process_features(task: dict, input_path: str) -> str:
    """
    处理视频的功能（features），生成中间结果文件，并返回路径。
    """
    features = task.get("features", [])
    if not features:
        return input_path  # 如果没有功能需要处理，直接返回原始输入路径

    # 构建中间文件路径
    temp_path = f"storage/outputs/{task['task_id']}_temp.mp4"
    vf_filters = []
    cmd = ["ffmpeg", "-i", input_path]

    # 功能处理逻辑
    if "mirrorflip" in features:
        vf_filters.append("hflip")

    if "md5" in features:
        cmd += ["-metadata", "comment=md5_patch"]

    if "breakoffbothends" in features:
        duration = get_video_duration(input_path)
        start = 3
        end = max(duration - 3, start + 0.1)
        cmd += ["-ss", str(start), "-to", str(end)]

    if "randomrotation" in features:
        vf_filters.extend(random_rotation_filter(input_path))

    # 添加滤镜和编码参数
    if vf_filters:
        cmd += ["-vf", ",".join(vf_filters)]
    cmd += ["-c:v", "libx264", "-c:a", "aac", "-strict", "experimental", "-y", temp_path]

    # 执行功能处理命令
    execute_command(cmd)
    return temp_path  # 返回中间文件路径


def process_effects(task: dict, input_path: str, output_path: str):
    """
    处理视频的特效（effects），并生成最终输出文件。
    """
    effects = task.get("effects", [])
    if not effects:
        return

    if "light" in effects:
        light_effect_command(input_path, output_path)


def random_rotation_filter(input_path: str) -> list:
    """
    构建随机旋转滤镜。
    """
    angle = random.choice([2, -2])
    zoom_ratio = 1.1
    width, height = get_video_resolution(input_path)
    radians = angle * 3.14159265 / 180
    return [
        f"rotate={radians}:ow=rotw({radians}):oh=roth({radians}):c=black,"
        f"scale=iw*{zoom_ratio}:ih*{zoom_ratio},"
        f"crop={width}:{height}:(in_w-{width})/2:(in_h-{height})/2"
    ]


def light_effect_command(input_path: str, output_path: str):
    """
    构建并执行扫光特效命令。
    """
    width, height = get_video_resolution(input_path)
    sweep_dir = "storage/effects/light/h" if width >= height else "storage/effects/light/v"
    sweep_files = [
        os.path.join(sweep_dir, f)
        for f in os.listdir(sweep_dir)
        if f.endswith((".mp4", ".mov", ".avi"))
    ]
    if not sweep_files:
        raise RuntimeError(f"No sweep light video found in {sweep_dir}")
    sweep_video = random.choice(sweep_files)
    sweep_opacity = 0.6
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
    execute_command(cmd)


def _notify_task_done(task, output_path, oss_result=None):
    """
    通知任务完成状态。
    """
    try:
        redis_kwargs = {
            'host': settings.redis_host,
            'port': settings.redis_port,
            'db': 0
        }
        if settings.redis_password:
            redis_kwargs['password'] = settings.redis_password
        r = redis.Redis(**redis_kwargs)

        # 构造通知数据
        notify_data = {
            "task_id": task.get("task_id"),
            "status": "SUCCESS",
            "result": {
                "output_path": output_path
            }
        }

        # 如果OSS上传成功，添加OSS信息
        if oss_result and oss_result.get("success"):
            notify_data["result"]["oss"] = {
                "presigned_url": oss_result["presigned_url"],
                "public_url": oss_result["public_url"],
                "object_key": oss_result["object_key"],
                "expiration": oss_result["expiration"]
            }
            print(f"[Notify] OSS URL: {oss_result['presigned_url']}")
        else:
            if oss_result:
                print(f"[Notify] OSS upload failed: {oss_result.get('error')}")

        r.publish('nova:task_done', json.dumps(notify_data))
        print(f"[Notify] Task completion message sent for task: {task.get('task_id')}")
    except Exception as e:
        print(f"[Notify] Redis publish failed: {e}")


def execute_command(cmd: list):
    """
    执行命令并捕获异常。
    """
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Command failed: {e}")
        raise


def safe_remove(file_path: str):
    """
    安全删除文件。
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Failed to remove file {file_path}: {e}")