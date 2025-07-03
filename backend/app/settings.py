from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_env: str = Field("production", env="APP_ENV")
    app_port: int = Field(8000, env="APP_PORT")
    secret_key: str = Field(..., env="SECRET_KEY")

    # Redis
    redis_host: str = Field("localhost", env="REDIS_HOST")
    redis_port: int = Field(6379, env="REDIS_PORT")
    redis_password: str = Field("", env="REDIS_PASSWORD")

    # Celery
    celery_broker_url: str = Field(..., env="CELERY_BROKER_URL")
    celery_result_backend: str = Field(..., env="CELERY_RESULT_BACKEND")

    class Config:
        # ⚠️ 只在开发环境中加载 .env 文件，生产中靠系统环境变量
        env_file = ".env"
        env_file_encoding = "utf-8"

    # def redis_url(self, db: int = 0):
    #     """构造带密码的 Redis URL，用于 redis-py 客户端"""
    #     if self.redis_password:
    #         return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{db}"
    #     return f"redis://{self.redis_host}:{self.redis_port}/{db}"


# ✅ 用缓存避免多次读取环境变量
@lru_cache
def get_settings():
    return Settings()


# 全局唯一设置对象
settings = get_settings()
