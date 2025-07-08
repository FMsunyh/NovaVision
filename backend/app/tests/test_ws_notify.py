import asyncio
import websockets

async def test_ws_notify():
    uri = "ws://localhost:8000/ws/notify"  # 根据你的实际服务端口和前缀调整
    async with websockets.connect(uri) as websocket:
        print("WebSocket 已连接，等待消息...")
        try:
            while True:
                msg = await websocket.recv()
                print("收到消息:", msg)
        except websockets.ConnectionClosed:
            print("WebSocket 连接已关闭")

if __name__ == "__main__":
    asyncio.run(test_ws_notify())