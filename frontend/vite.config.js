// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': {
//         target: 'http://localhost:8000',
//         changeOrigin: true,
//         rewrite: path => path.replace(/^\/api/, ''),
//         ws: true // 启用 WebSocket 代理
//       }
//     }
//   }
// })

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  console.log(mode)
  // 加载 .env.[mode] 文件中的环境变量
  const env = loadEnv(mode, process.cwd())
  console.log(env.VITE_API_URL)
  console.log(process.cwd())

  return {
    plugins: [react()],
    server: {
      proxy: {
        // 开发环境代理
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
          ws: true
        }
      }
    },
    // 定义全局常量，在代码中可以直接访问
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    }
  }
})