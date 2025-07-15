# NovaVision
AI-焕影

## 描述
本项目为。。。

## 运行要求
- Python 3.11+
- 安装依赖
  ```bash
    python -m venv .venv
    source .venv/bin/activate 
    pip install --upgrade pip
    pip install -r requirements.txt
  ```

## 在本地部署后端服务
启动redis
```bash
docker-compose -f docker-compose.prod.yml up redis -d
```

启动FastAPI
```bash
cd /work/NovaVision/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --env-file ../.env
```

启动celery worker
```bash
cd /work/NovaVision/backend
cat ../.env | xargs -0 -I {} env {} python app/worker.py
```

OR

```bash
cd /work/NovaVision/backend
bash app/run_worker.sh
```

注意加载的环境变量.env