import requests

def upload_file(signed_url, file_path):
    try:
        # 打开文件
        with open(file_path, 'rb') as file:
            # 发送PUT请求上传文件
            response = requests.put(signed_url, data=file)
     
        print(f"返回上传状态码：{response.status_code}")
        if response.status_code == 200:
            print("使用网络库上传成功")
        print(response.text)
 
    except Exception as e:
        print(f"发生错误：{e}")

if __name__ == "__main__":
    # 将<signedUrl>替换为授权URL。
    signed_url = f"https://novavision.oss-cn-guangzhou.aliyuncs.com/001064a7-f701-42a7-98af-4b23fddb5aa4?x-oss-credential=LTAI5tEimvL6oCKY1M2ocXcX%2F20250711%2Fcn-guangzhou%2Foss%2Faliyun_v4_request&x-oss-date=20250711T085315Z&x-oss-expires=3600&x-oss-signature-version=OSS4-HMAC-SHA256&x-oss-signature=4a72e4694e4946915735371aa8215d0881c64bd7b16534927e4cdb9a6c5ea461"
    
    # 填写本地文件的完整路径。如果未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件。
    file_path = "/work/NovaVision/temp/input.mp4"

    upload_file(signed_url, file_path)