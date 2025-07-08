import argparse
import alibabacloud_oss_v2 as oss

# 创建命令行参数解析器
parser = argparse.ArgumentParser(description="put object sample")
# 添加命令行参数 --region，表示存储空间所在的区域，必需参数
parser.add_argument('--region', help='The region in which the bucket is located.', required=True)
# 添加命令行参数 --bucket，表示存储空间的名称，必需参数
parser.add_argument('--bucket', help='The name of the bucket.', required=True)
# 添加命令行参数 --endpoint，表示其他服务可用来访问OSS的域名，非必需参数
parser.add_argument('--endpoint', help='The domain names that other services can use to access OSS')
# 添加命令行参数 --key，表示对象的名称，必需参数
parser.add_argument('--key', help='The name of the object.', required=True)

def main():
    args = parser.parse_args()  # 解析命令行参数

    # 从环境变量中加载凭证信息，用于身份验证
    credentials_provider = oss.credentials.EnvironmentVariableCredentialsProvider()

    # 加载SDK的默认配置，并设置凭证提供者
    cfg = oss.config.load_default()
    cfg.credentials_provider = credentials_provider
    # 设置配置中的区域信息
    cfg.region = args.region
    # 如果提供了endpoint参数，则设置配置中的endpoint
    if args.endpoint is not None:
        cfg.endpoint = args.endpoint

    # 使用配置好的信息创建OSS客户端
    client = oss.Client(cfg)

    # 定义要上传的字符串内容
    text_string = "Hello, OSS!"
    data = text_string.encode('utf-8')  # 将字符串编码为UTF-8字节串

    # 执行上传对象的请求，指定存储空间名称、对象名称和数据内容
    result = client.put_object(oss.PutObjectRequest(
        bucket=args.bucket,
        key=args.key,
        body=data,
    ))

    # 输出请求的结果状态码、请求ID、内容MD5、ETag、CRC64校验码和版本ID，用于检查请求是否成功
    print(f'status code: {result.status_code},'
          f' request id: {result.request_id},'
          f' content md5: {result.content_md5},'
          f' etag: {result.etag},'
          f' hash crc64: {result.hash_crc64},'
          f' version id: {result.version_id},'
    )

if __name__ == "__main__":
    main()  # 脚本入口，当文件被直接运行时调用main函数

"""
 python oss_test1.py --region "cn-guangzhou" --bucket "novavision" --key "test-key" --endpoint "oss-cn-guangzhou.aliyuncs.com"
"""