#!/bin/bash

# 从 .env 文件加载变量（过滤注释和空行）
export $(grep -v '^#' ../.env | xargs)

celery -A app.celery_app worker \
  --loglevel=info \
  --concurrency=4 \
  --pool=prefork \
  --hostname=video_worker@%h
#   --queues=video
