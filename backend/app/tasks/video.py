import subprocess

def process_video(task: dict):
    input_path = task["upload_path"]
    output_path = f"storage/outputs/{task['task_id']}.mp4"
    cmd = ["ffmpeg", "-i", input_path]

    if task.get("clip"):
        start, end = task["clip"]
        if start is not None and end is not None:
            cmd += ["-ss", str(start), "-to", str(end)]

    if task["extract_fps"] > 0:
        cmd += ["-vf", f"fps={task['extract_fps']}"]

    speed = task["speed"]
    if speed != 1.0:
        cmd += ["-filter_complex", f"[0:v]setpts={1/speed}*PTS[v];[0:a]atempo={speed}[a]",
                "-map", "[v]", "-map", "[a]"]

    if task.get("watermark"):
        cmd += ["-vf", f"drawtext=text='{task['watermark']}':x=10:y=10:fontsize=24:fontcolor=white"]

    cmd += [output_path]
    subprocess.run(cmd, check=True)
    return output_path
