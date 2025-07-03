from app.tasks.worker import celery_app
celery_app.autodiscover_tasks(['app.tasks'])
