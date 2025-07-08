from datetime import timedelta
import os
import sys
import alibabacloud_oss_v2 as oss
from pathlib import Path

# 添加父目录到 Python 路径，以便能导入 app 模块
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.settings import settings

def test_oss_connection():
    """测试 OSS 连接和基本操作"""
    try:
        # 使用 settings 中的配置创建 OSS 客户端
        cfg = oss.config.load_default()
        
        # 设置认证信息
        cfg.credentials_provider = oss.credentials.StaticCredentialsProvider(
            access_key_id=settings.oss_access_key_id,
            access_key_secret=settings.oss_access_key_secret
        )
        
        # 设置区域和端点
        cfg.region = settings.oss_region
        cfg.endpoint = settings.oss_endpoint
        
        # 创建客户端
        client = oss.Client(cfg)
        
        print(f"✅ OSS 客户端创建成功")
        print(f"📍 区域: {settings.oss_region}")
        print(f"🪣 存储桶: {settings.oss_bucket_name}")
        print(f"🔗 端点: {settings.oss_endpoint}")
        
        return client
        
    except Exception as e:
        print(f"❌ OSS 客户端创建失败: {e}")
        return None

def test_upload_file(file_path: str):
    """测试上传文件"""
    client = test_oss_connection()
    if not client:
        return False
    
    try:
        if not os.path.exists(file_path):
            print(f"❌ 文件不存在: {file_path}")
            return False
        
        # 读取文件内容
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # 获取文件名
        file_name = os.path.basename(file_path)
        object_key = f"test/uploads/{file_name}"
        
        # 上传文件
        result = client.put_object(oss.PutObjectRequest(
            bucket=settings.oss_bucket_name,
            key=object_key,
            body=file_data,
        ))
        
        print(f"✅ 文件上传成功!")
        print(f"📄 本地文件: {file_path}")
        print(f"☁️  远程路径: {object_key}")
        print(f"📄 状态码: {result.status_code}")
        print(f"🆔 请求ID: {result.request_id}")
        
        # 上传成功后，生成各种访问URL
        print(f"\n📂 文件访问地址:")
        
        # 发送请求以生成指定对象的预签名PUT请求
        pre_result = client.presign(oss.GetObjectRequest(
            bucket=settings.oss_bucket_name,
            key=object_key,
        ),expires=timedelta(seconds=3600)) # 设置过期时间，单位为秒，此处设置为3600秒

        # 打印预签名请求的方法、过期时间和URL，以便确认预签名链接的有效性
        print(f'method: {pre_result.method},'
            f' expiration: {pre_result.expiration.strftime("%Y-%m-%dT%H:%M:%S.000Z")},'
            f' url: {pre_result.url}'
            )

        # 打印预签名请求的已签名头信息，这些信息在发送实际请求时会被包含在HTTP头部
        for key, value in pre_result.signed_headers.items():
            print(f'signed headers key: {key}, signed headers value: {value}')
        
        return True
        
    except Exception as e:
        print(f"❌ 文件上传失败: {e}")
        return False

def main():
    """主函数：执行各种测试"""
    print("🚀 开始 OSS 功能测试...")
    print("=" * 50)
    
    # 显示配置信息
    print("📋 当前配置:")
    print(f"   区域: {settings.oss_region}")
    print(f"   存储桶: {settings.oss_bucket_name}")
    print(f"   端点: {settings.oss_endpoint}")
    print(f"   AccessKey ID: {settings.oss_access_key_id[:8]}...")
    print("=" * 50)
    
    # 测试连接
    print("\n1️⃣ 测试 OSS 连接...")
    if not test_oss_connection():
        print("❌ 连接测试失败，退出程序")
        return
    
    # 测试上传文件（如果有的话）
    print("\n2️⃣ 测试上传文件...")
    test_file_path = "storage/test_file.txt"
    if os.path.exists(test_file_path):
        test_upload_file(test_file_path)
    else:
        print(f"⚠️  测试文件 {test_file_path} 不存在，跳过文件上传测试")

    print("\n🎉 OSS 测试完成!")

if __name__ == "__main__":
    main()