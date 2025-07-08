import requests

file_url = "https://novavision.oss-cn-guangzhou.aliyuncs.com/test/Hello.txt?x-oss-signature-version=OSS4-HMAC-SHA256&x-oss-date=20250708T083512Z&x-oss-expires=3599&x-oss-credential=LTAI5tEimvL6oCKY1M2ocXcX%2F20250708%2Fcn-guangzhou%2Foss%2Faliyun_v4_request&x-oss-signature=1b8ef15283d5764330154a6e78e73ace6d1a3a0e5cb3b196eac27c811bc7a9bd"
save_path = "app/tests/myfile.txt"

try:
    response = requests.get(file_url, stream=True)
    if response.status_code == 200:
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(4096):
                f.write(chunk)
        print("Download completed!")
    else:
        print(f"No file to download. Server replied HTTP code: {response.status_code}")
except Exception as e:
    print("Error during download:", e)