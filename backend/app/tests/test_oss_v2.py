#!/usr/bin/env python3
"""
测试 alibabacloud_oss_v2 库的 OSS 工具类
"""
import os
import sys
import tempfile
import time

# 添加 app 模块路径
root = os.path.join(os.path.dirname(__file__), '../../')
sys.path.insert(0, root)

from app.utils.oss_utils import OSSUploader
from app.settings import get_settings

def create_test_video_file():
    """创建测试视频文件"""
    # 创建一个小的测试文件
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as f:
        # 写入一些测试数据
        f.write(b'fake video content for testing')
        return f.name

def test_oss_uploader():
    """测试OSS上传工具类"""
    print("🧪 开始测试 alibabacloud_oss_v2 OSS工具类...")
    
    # 检查环境变量
    settings = get_settings()
    required_vars = [
        'oss_access_key_id', 'oss_access_key_secret', 
        'oss_bucket_name', 'oss_region'
    ]
    
    for var in required_vars:
        if not getattr(settings, var, None):
            print(f"❌ 环境变量缺失: {var.upper()}")
            return False
    
    print(f"✅ OSS配置检查通过")
    print(f"   Bucket: {settings.oss_bucket_name}")
    print(f"   Region: {settings.oss_region}")
    print(f"   Endpoint: {settings.oss_endpoint}")
    
    # 创建测试文件
    test_file = create_test_video_file()
    print(f"📁 创建测试文件: {test_file}")
    
    try:
        # 初始化上传器
        uploader = OSSUploader()
        print("✅ OSS上传器初始化成功")
        
        # 测试上传
        object_key = f"test/test_video_{int(time.time())}.mp4"
        print(f"📤 开始上传测试... object_key: {object_key}")
        
        success, message, oss_key = uploader.upload_video(test_file, object_key)
        
        if success:
            print(f"✅ 上传成功: {message}")
            print(f"   OSS Key: {oss_key}")
            
            # 测试生成预签名URL
            print("🔗 生成预签名URL...")
            presigned_url = uploader.generate_presigned_url(oss_key, 3600)
            
            if presigned_url:
                print(f"✅ 预签名URL生成成功:")
                url_str = presigned_url.url if hasattr(presigned_url, "url") else str(presigned_url)
                print(f"   URL: {url_str[:100]}...")
            else:
                print("❌ 预签名URL生成失败")
                
            # 测试公共URL
            public_url = uploader.get_public_url(oss_key)
            print(f"🌐 公共URL: {public_url}")
            
            # 测试检查对象存在性
            exists = uploader.object_exists(oss_key)
            print(f"🔍 对象存在性检查: {'存在' if exists else '不存在'}")
            
            # 测试完整的上传并获取URL功能
            print("🔄 测试完整功能: upload_and_get_urls...")
            result = uploader.upload_and_get_urls(test_file, f"test/full_test_{int(time.time())}.mp4")
            print(f"✅ 完整功能测试成功:")
            print(f"   Object Key: {result['object_key']}")
            url_str = result['presigned_url'].url if hasattr(result['presigned_url'], "url") else str(result['presigned_url'])
            print(f"   预签名URL: {url_str[:100]}...")
            print(f"   过期时间: {result['expiration']}")
            
            # 清理测试对象（可选）
            print("🗑️  清理测试对象...")
            if uploader.delete_object(oss_key):
                print("✅ 测试对象删除成功")
            else:
                print("⚠️  测试对象删除失败（可能不影响功能）")
                
            if uploader.delete_object(result['object_key']):
                print("✅ 完整测试对象删除成功")
            else:
                print("⚠️  完整测试对象删除失败（可能不影响功能）")
                
        else:
            print(f"❌ 上传失败: {message}")
            return False
            
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # 清理测试文件
        if os.path.exists(test_file):
            os.unlink(test_file)
            print(f"🗑️  清理本地测试文件: {test_file}")
    
    print("🎉 OSS工具类测试完成！")
    return True

if __name__ == "__main__":
    success = test_oss_uploader()
    exit(0 if success else 1)
