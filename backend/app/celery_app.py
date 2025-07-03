from celery import Celery
from app.settings import settings


celery_app = Celery(
    "worker",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

# 配置 Celery
celery_app.conf.update(
    worker_concurrency=4,  # 限制并发工作进程数量
    task_acks_late=True,   # 确保任务完成后才确认
    task_reject_on_worker_lost=True,  # 避免任务丢失
    broker_connection_retry_on_startup=True,
    # imports=["app.tasks"],  # 确保 Celery 导入 tasks 模块
    result_expires=3600, # 任务结果过期时间
    task_default_queue = 'default'
)

# 自动发现 tasks 包下的所有任务
celery_app.autodiscover_tasks(['app.tasks.effects','app.tasks.video'])

# def generate_task_routes(task_base_path: str, default_queue: str = "default_queue"):
#     """
#     Dynamically assign all tasks to the default queue.

#     :param task_base_path: Base path of task modules (e.g., 'app.tasks').
#     :param default_queue: Queue name to which all tasks will be assigned.
#     :return: A dictionary of task routes.
#     """
#     task_routes = {}

#     # Load the base module
#     base_module = importlib.import_module(task_base_path)

#     # Iterate through all submodules under the base path
#     for _, module_name, _ in pkgutil.walk_packages(base_module.__path__, base_module.__name__ + "."):
#         try:
#             module = importlib.import_module(module_name)

#             # Iterate through all attributes in the module
#             for attr_name in dir(module):
#                 if attr_name.startswith("__"):  # Skip special attributes
#                     continue

#                 attr = getattr(module, attr_name)

#                 # Include only Celery tasks defined under the base path
#                 if isinstance(attr, Task) and attr.__module__.startswith(task_base_path):
#                     task_routes[attr.name] = {"queue": default_queue}

#         except Exception as e:
#             print(f"Error processing module {module_name}: {e}")

#     return task_routes

# celery_app.conf.task_routes = generate_task_routes("app.tasks")