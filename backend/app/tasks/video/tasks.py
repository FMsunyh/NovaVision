import subprocess
from celery import shared_task
import random
from app.utils.video_utils import get_video_duration, get_video_resolution

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

        # if "mirrorflip" in features:
        #     cmd += ["-vf", "hflip"]

    cmd += [output_path]
    subprocess.run(cmd, check=True)
    return output_path
