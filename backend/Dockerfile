# syntax=docker/dockerfile:1
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

# 使用 --mount=type=cache 挂载 pip 缓存目录
# 这会将缓存保留在宿主机上，以加速后续构建
# 同时合并两个 pip install 命令以优化层
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
