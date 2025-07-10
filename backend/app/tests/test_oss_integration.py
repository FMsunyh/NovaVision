"""
测试OSS集成的完整流程
"""
import asyncio
import json
import redis
from app.utils.oss_utils import upload_processed_video
from app.settings import settings


def test_oss_upload():
    """测试OSS上传功能"""
    print("🧪 测试OSS上传功能...")
    
    # 模拟一个处理后的视频文件
    test_file = "storage/test_file.txt"  # 用文本文件模拟
    test_task_id = "test_123"
    
    result = upload_processed_video(test_file, test_task_id)
    
    if result["success"]:
        print("✅ OSS上传测试成功!")
        print(f"📂 对象键: {result['object_key']}")
        print(f"🔗 预签名URL: {result['presigned_url']}")
        print(f"🌐 公共URL: {result['public_url']}")
        print(f"⏰ 过期时间: {result['expiration']}")
        return result
    else:
        print(f"❌ OSS上传测试失败: {result['error']}")
        return None


def test_redis_notification(oss_result):
    """测试Redis通知功能"""
    print("\n📢 测试Redis通知功能...")
    
    try:
        redis_kwargs = {
            'host': settings.redis_host,
            'port': settings.redis_port,
            'db': 0
        }
        if settings.redis_password:
            redis_kwargs['password'] = settings.redis_password
        r = redis.Redis(**redis_kwargs)
        
        # 构造通知数据
        notify_data = {
            "task_id": "test_123",
            "status": "SUCCESS",
            "result": {
                "output_path": "storage/outputs/test_123.mp4"
            }
        }
        
        # 如果OSS上传成功，添加OSS信息
        if oss_result:
            notify_data["result"]["oss"] = {
                "presigned_url": oss_result["presigned_url"],
                "public_url": oss_result["public_url"],
                "object_key": oss_result["object_key"],
                "expiration": oss_result["expiration"]
            }
        
        # 发布消息
        r.publish('nova:task_done', json.dumps(notify_data))
        print("✅ Redis通知发送成功!")
        print(f"📨 消息内容: {json.dumps(notify_data, indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        print(f"❌ Redis通知失败: {e}")


async def test_websocket_listener():
    """测试WebSocket监听"""
    print("\n👂 测试WebSocket监听...")
    print("💡 请在另一个终端运行 FastAPI 服务，然后在浏览器中打开前端页面测试")
    
    # 这里可以添加WebSocket客户端测试代码
    try:
        import websockets
        
        uri = "ws://localhost:8000/api/ws/notify"
        async with websockets.connect(uri) as websocket:
            print(f"🔗 已连接到 {uri}")
            print("⏳ 等待消息...")
            
            # 监听5秒钟
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📩 收到消息: {message}")
            except asyncio.TimeoutError:
                print("⏰ 5秒内未收到消息")
                
    except ImportError:
        print("⚠️ 未安装 websockets，跳过WebSocket客户端测试")
    except Exception as e:
        print(f"❌ WebSocket测试失败: {e}")


def main():
    """主测试函数"""
    print("🚀 开始OSS集成测试...")
    print("=" * 50)
    
    # 测试OSS上传
    oss_result = test_oss_upload()
    
    # 测试Redis通知
    test_redis_notification(oss_result)
    
    # 测试WebSocket监听
    print("\n🔧 WebSocket监听测试:")
    print("1. 启动FastAPI服务: uvicorn app.main:app --reload")
    print("2. 打开前端页面并上传视频")
    print("3. 观察是否自动显示OSS链接")
    
    # 显示集成说明
    print("\n📋 完整集成流程:")
    print("1. ✅ 用户上传视频 → 创建Celery任务")
    print("2. ✅ Celery处理视频 → ffmpeg处理")
    print("3. ✅ 上传到OSS → 获取预签名URL")
    print("4. ✅ Redis发布通知 → 包含OSS信息")
    print("5. ✅ WebSocket推送 → 前端接收")
    print("6. ✅ 前端自动刷新 → 显示OSS视频")
    
    print("\n🎉 OSS集成测试完成!")


if __name__ == "__main__":
    main()
