import subprocess
from celery import shared_task

@shared_task
def process_video(task: dict):
    input_path = task["upload_path"]
    output_path = f"storage/outputs/{task['task_id']}.mp4"
    cmd = ["ffmpeg", "-i", input_path]

    # 处理 clip 参数
    clip = task.get("clip")
    if clip and clip[0] is not None and clip[1] is not None:
        start, end = clip
        cmd += ["-ss", str(start), "-to", str(end)]

    # 处理帧率
    if task.get("extract_fps", 0) > 0:
        cmd += ["-vf", f"fps={task['extract_fps']}"]

    # 处理倍速
    speed = task.get("speed", 1.0)
    if speed != 1.0:
        cmd += ["-filter_complex", f"[0:v]setpts={1/speed}*PTS[v];[0:a]atempo={speed}[a]",
                "-map", "[v]", "-map", "[a]"]

    # 处理水印
    watermark = task.get("watermark")
    if watermark:
        cmd += ["-vf", f"drawtext=text='{watermark}':x=10:y=10:fontsize=24:fontcolor=white"]

    cmd += [output_path]
    subprocess.run(cmd, check=True)
    return output_path
