#!/bin/bash

celery -A app.celery_app worker \
  --loglevel=info \
  --concurrency=4 \
  --pool=prefork \
  --hostname=video_worker@%h
#   --queues=video
