import subprocess

def get_video_duration(input_path):
    """获取视频总时长（秒）"""
    cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
           '-of', 'default=noprint_wrappers=1:nokey=1', input_path]
    return float(subprocess.check_output(cmd).decode().strip())

def get_video_resolution(path):
    """获取原始分辨率 (width, height)"""
    cmd = [
        'ffprobe', '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'csv=s=x:p=0',
        path
    ]
    output = subprocess.check_output(cmd).decode().strip()
    width, height = map(int, output.split('x'))
    return width, height
