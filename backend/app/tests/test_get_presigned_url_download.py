import sys
from pathlib import Path

# 添加父目录到 Python 路径，以便能导入 app 模块
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.utils.oss_utils import generate_oss_presigned_url


url =  generate_oss_presigned_url(object_key="001064a7-f701-42a7-98af-4b23fddb5aa4")
print("URL", url)