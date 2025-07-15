# from dotenv import load_dotenv
# load_dotenv(dotenv_path="../.env")

from app.celery_app import celery_app


# 可以直接在 shell 启动:
# celery -A app.celery_app worker --loglevel=info

if __name__ == '__main__':
    print("Celery 配置信息：")
    for key in sorted(celery_app.conf):
        print(f"{key}: {celery_app.conf[key]}")

    celery_app.worker_main([
        'worker',
        '--loglevel=info',
        '--concurrency=4',  # 指定并发数
        '--queues=default'  # 指定队列
        # '--queues=default,image,video'  # 指定队列
    ])