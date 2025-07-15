const axios = require('axios');
const fs = require('fs');

async function uploadFile(signedUrl, filePath) {
    try {
        // 读取文件内容
        const file = fs.createReadStream(filePath);

        const headers = {
                'Content-Type': 'video/mp4'
            };
        // 使用 axios 发送 PUT 请求上传文件
        const response = await axios.put(signedUrl, file, {
            headers: headers
        });

        console.log(`返回上传状态码：${response.status}`);
        if (response.status === 200) {
            console.log("文件上传成功");
        }
        console.log(response.data);
    } catch (error) {
        console.error(`发生错误：${error.message}`);
    }
}

// 主程序
(async () => {
    // 替换为你的授权URL
    const signedUrl = "https://novavision.oss-cn-guangzhou.aliyuncs.com/001064a7-f701-42a7-98af-4b23fddb5aa4?x-oss-credential=LTAI5tEimvL6oCKY1M2ocXcX%2F20250711%2Fcn-guangzhou%2Foss%2Faliyun_v4_request&x-oss-date=20250711T092521Z&x-oss-expires=3600&x-oss-signature-version=OSS4-HMAC-SHA256&x-oss-signature=c079bdeb8ef41b726e5477aae746c28d7f90146b8416755f06f9bd7980199037";
    // const signedUrl = "https://novavision.oss-cn-guangzhou.aliyuncs.com/b2aa99e6-2109-45a4-a11f-5f724633c54c?x-oss-signature-version=OSS4-HMAC-SHA256&x-oss-date=20250711T093130Z&x-oss-expires=3599&x-oss-credential=LTAI5tEimvL6oCKY1M2ocXcX%2F20250711%2Fcn-guangzhou%2Foss%2Faliyun_v4_request&x-oss-signature=5b70ae3eb63a8af865099a000f142f0148bcdd0cf4f768a1e0a69d8b84d36cfb";
    
    // 本地文件路径
    const filePath = "/work/NovaVision/temp/input.mp4";

    await uploadFile(signedUrl, filePath);
})();