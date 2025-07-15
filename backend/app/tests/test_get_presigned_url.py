import requests

# 测试获取预签名URL
def test_get_presigned_url():
    # 替换为你的实际API地址
    url = "http://localhost:8001/api/presign_url"
    
    try:
        # 发送GET请求
        response = requests.get(url)
        
        # 检查响应状态码
        assert response.status_code == 200, f"预期状态码200，实际得到{response.status_code}"
        
        # 检查返回数据格式
        data = response.json()
        assert "presigned_url" in data, "响应中缺少presigned_url字段"
        assert isinstance(data["presigned_url"], str), "presigned_url不是字符串"
        assert data["presigned_url"].startswith("http"), "presigned_url不是有效的URL"
        
        print("测试通过！返回的预签名URL:", data["presigned_url"])
        
    except Exception as e:
        print("测试失败:", str(e))
        raise

# 运行测试
if __name__ == "__main__":
    test_get_presigned_url()