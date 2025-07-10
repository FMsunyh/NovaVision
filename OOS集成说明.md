# OSS集成部署说明

## 功能概述

视频处理完成后自动上传到阿里云OSS，前端通过WebSocket实时接收OSS预签名URL，无需手动刷新页面。

**重要更新**: 已切换到 `alibabacloud_oss_v2` 官方新版SDK，提供更好的性能和稳定性。

## 主要改动

### 1. 后端改动

#### 依赖库更新
- 使用 `alibabacloud-oss-v2` 替代 `oss2`
- 在 `requirements.txt` 中已更新依赖

#### 新增文件
- `backend/app/utils/oss_utils.py` - OSS上传工具类（基于 alibabacloud_oss_v2）
- `backend/app/tests/test_oss_integration.py` - 集成测试脚本
- `backend/test_oss_v2.py` - 新版SDK测试脚本

#### 修改文件
- `backend/app/tasks/video/tasks.py` - 集成OSS上传
- `backend/app/settings.py` - 已包含OSS配置
- `backend/requirements.txt` - 更新为 alibabacloud-oss-v2

### 2. 前端改动

#### 修改文件
- `frontend/src/App.jsx` - WebSocket消息处理，优先使用OSS地址
- `frontend/src/components/ResultPanel.jsx` - 支持OSS链接显示

## 工作流程

```
用户上传视频
    ↓
创建Celery任务
    ↓
ffmpeg处理视频
    ↓
上传到阿里云OSS（alibabacloud_oss_v2） ← 新增
    ↓
获取预签名URL ← 新增
    ↓
Redis发布通知（包含OSS信息）← 修改
    ↓
WebSocket推送到前端 ← 修改
    ↓
前端自动显示OSS视频 ← 修改
```

## 配置要求

### 环境变量（已在.env中配置）
```env

```

### Python依赖
```bash
pip install alibabacloud-oss-v2
```

## 测试步骤

### 1. 测试OSS功能
```bash
cd backend
python app/tests/oss_test_get_url.py
```

### 2. 测试集成功能
```bash
cd backend
python app/tests/test_oss_integration.py
```

### 3. 完整流程测试
1. 启动Redis: `redis-server`
2. 启动Celery: `celery -A app.celery_app worker --loglevel=info`
3. 启动后端: `uvicorn app.main:app --reload`
4. 启动前端: `npm run dev`
5. 上传视频测试

## 关键特性

### 1. 自动OSS上传
- 视频处理完成后自动上传到OSS
- 生成24小时有效的预签名URL
- 支持大文件上传

### 2. 实时前端更新
- WebSocket实时推送OSS地址
- 前端优先使用OSS链接
- 无需手动刷新页面

### 3. 用户体验优化
- 云端存储标识
- 链接有效期提示
- 支持直接分享OSS链接

## 故障排除

### 1. OSS上传失败
- 检查阿里云AccessKey权限
- 确认Bucket存在且可写
- 查看网络连接状态

### 2. WebSocket连接失败
- 检查Redis连接
- 确认频道名称匹配
- 查看浏览器控制台错误

### 3. 前端不显示OSS链接
- 检查WebSocket消息格式
- 确认前端消息解析逻辑
- 查看浏览器开发者工具

## 性能优化

### 1. OSS配置
- 使用内网endpoint（如在阿里云服务器）
- 启用OSS传输加速
- 合理设置预签名URL过期时间

### 2. 前端优化
- WebSocket连接池管理
- 消息去重处理
- 错误重试机制

## 安全考虑

### 1. OSS安全
- 使用预签名URL而非公开链接
- 设置合理的过期时间
- 定期轮换AccessKey

### 2. WebSocket安全
- 实现用户认证
- 消息来源验证
- 防止消息重放攻击
