import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 加载 .env.[mode] 文件中的环境变量
  console.log(mode)
  const env = loadEnv(mode, process.cwd())
  console.log(env.VITE_VERSION)

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',   // 你的后端HTTP接口地址
          changeOrigin: true,
        },
        '/socket': {
          target: 'ws://localhost:8000',    // 你的后端WebSocket服务地址
          ws: true,
          changeOrigin: true,
        }
      }
    }
  }
})