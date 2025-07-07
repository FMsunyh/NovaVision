import subprocess
from celery import shared_task

def get_video_duration(input_path):
    # 获取视频总时长（秒）
    cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
           '-of', 'default=noprint_wrappers=1:nokey=1', input_path]
    return float(subprocess.check_output(cmd).decode().strip())

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

    effects = task.get("effects")
    if effects:
        print("Processing effects:", effects)

    cmd += [output_path]
    subprocess.run(cmd, check=True)
    return output_path
