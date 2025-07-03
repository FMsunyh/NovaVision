import redis
from app.settings import settings
import traceback

def test_redis_connection():
    try:
        r = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password,
            decode_responses=True
        )
        r.set("ping", "pong")
        print("✅ Redis connection successful:", r.get("ping"))
    except Exception as e:
        print("❌ Redis connection failed:", e)
        traceback.print_exc()

if __name__ == "__main__":
    test_redis_connection()
