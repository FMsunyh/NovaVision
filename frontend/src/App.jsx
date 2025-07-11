import React, { useState, useEffect, useRef } from 'react'
import FeatureSelector from './components/FeatureSelector'
import EffectSelector from './components/EffectSelector'
import UploadPanel from './components/UploadPanel'
import ResultPanel from './components/ResultPanel'

function App() {
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [selectedEffects, setSelectedEffects] = useState([])
  const [file, setFile] = useState(null)
  const [taskId, setTaskId] = useState(null)
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  // WebSocket 相关
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

    // // 自动生成 WebSocket 地址
    // const getWebSocketUrl = () => {
    //   if (import.meta.env.DEV) {
    //   // 开发环境，连接本地 Vite 代理端口（例如 5173）
    //   return ''

    //   } else {
    //   // 生产环境，使用当前页面的协议和域名，自动切换 ws/wss
    //   const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    //   const host = window.location.host

    //   console.log('WebSocket 连接地址=======================:', `${protocol}://${host}/`)

    //   return `${protocol}//${host}/`
    //   }
    // }

  // WebSocket 连接管理
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return // 已经连接
    }

    // const ws = new WebSocket(getWebSocketUrl()+'/socket/notify')
    const ws = new WebSocket('/socket/notify')
    
    ws.onopen = () => {
      console.log('WebSocket 已连接')
      setError(null)
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('收到 WebSocket 消息:', data)
        
        // 只处理当前任务的完成消息
        if (data.task_id === taskId && data.status === 'SUCCESS') {
          setStatus('SUCCESS')
          
          // 优先使用OSS预签名URL，如果没有则使用本地API
          if (data.result && data.result.oss && data.result.oss.presigned_url) {
            setResult(data.result.oss.presigned_url)
            console.log('任务完成，使用OSS地址:', data.result.oss.presigned_url)
          } else {
            setResult(`/api/result/${taskId}`)
            console.log('任务完成，使用本地地址')
          }
          
          ws.close() // 任务完成后关闭连接
        }
      } catch (e) {
        console.warn('WebSocket 消息解析失败:', e)
      }
    }
    
    ws.onerror = (e) => {
      console.error('WebSocket 错误:', e)
      setError('连接错误，请检查网络')
    }
    
    ws.onclose = (e) => {
      console.log('WebSocket 连接关闭:', e.code, e.reason)
      wsRef.current = null
      
      // 非正常关闭且有任务时，尝试重连
      if (taskId && e.code !== 1000 && e.code !== 1001) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('尝试重新连接 WebSocket...')
          connectWebSocket()
        }, 3000)
      }
    }
    
    wsRef.current = ws
  }

  // 清理 WebSocket 连接
  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'cleanup')
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  // 当有任务 ID 时建立 WebSocket 连接
  useEffect(() => {
    if (taskId && status !== 'SUCCESS') {
      connectWebSocket()
    } else {
      cleanupWebSocket()
    }
    
    return cleanupWebSocket // 组件卸载时清理
  }, [taskId, status])

  // 上传处理
  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    setError(null)
    setResult(null)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('features', JSON.stringify(selectedFeatures))
    formData.append('effects', JSON.stringify(selectedEffects))
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`)
      }
      
      const data = await response.json()
      setTaskId(data.task_id)
      setStatus('PENDING')
      console.log('上传成功，任务 ID:', data.task_id)
      
    } catch (err) {
      setError(err.message)
      console.error('上传错误:', err)
    } finally {
      setUploading(false)
    }
  }

  // 手动查询状态（保留作为备用）
  const checkStatus = async () => {
    if (!taskId) return
    
    try {
      const response = await fetch(`/api/status/${taskId}`)
      const data = await response.json()
      setStatus(data.status)
      
      if (data.status === 'SUCCESS') {
        setResult(`/api/result/${taskId}`)
      } else if (data.status === 'FAILURE') {
        setError('任务处理失败')
      }
    } catch (err) {
      setError('查询状态失败')
    }
  }

  // 辅助函数：获取功能中文名
  const getFeatureLabel = (key) => {
    const featureLabels = {
      dedup: '基础去重',
      mirrorflip: '镜像翻转',
      md5: '修改MD5',
      smart_capture: '智能抽帧',
      color: '智能调色',
      sharpen: '画面锐化',
      breakoffbothends: '掐头去尾',
      speedup: '随机加速',
      randommirror: '随机镜像',
      randomrotation: '随机旋转',
    }
    return featureLabels[key] || key
  }

  // 辅助函数：获取特效中文名
  const getEffectLabel = (key) => {
    const effectLabels = {
      light: '扫光',
      fadein: '泛光开幕',
      dropin: '下降开幕',
      bookmode: '书单模式',
      blendmode: '溶图模式',
      triple: '横版三屏',
      goods: '好物',
      movie: '影视',
      drama: '短剧',
      shop: '探店',
    }
    return effectLabels[key] || key
  }

  return (
    <div style={{
      maxWidth: 1100,
      margin: '40px auto',
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 8px #eee',
      padding: 32,
      minHeight: '80vh',
      width: '95vw',
      boxSizing: 'border-box',
      overflowX: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <img src="/logo.svg" alt="logo" style={{ height: 40, marginRight: 16 }} />
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: 28 }}>NovaVision | 快速剪辑</h1>
      </div>
      
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ background: '#fafbfc', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #ececec' }}>
            <FeatureSelector selected={selectedFeatures} onChange={setSelectedFeatures} />
          </div>
          <div style={{ background: '#fafbfc', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #ececec' }}>
            <EffectSelector selected={selectedEffects} onChange={setSelectedEffects} />
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: 320 }}>
          {/* 已选择的处理方式和特效展示 */}
          {(selectedFeatures.length > 0 || selectedEffects.length > 0) && (
            <div style={{ background: '#fafbfc', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #ececec' }}>
              <div style={{ color: '#7c3aed', fontWeight: 600, marginBottom: 8, fontSize: 16 }}>
                <span style={{ marginRight: 8, fontSize: 18 }}>⎯⎯</span>已选择的处理方式与特效
              </div>
              {selectedFeatures.length > 0 && (
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>处理方式：
                  <span style={{ color: '#333', fontWeight: 400, fontSize: 15 }}>
                    {selectedFeatures.map(f => `【${getFeatureLabel(f)}】`).join('、')}
                  </span>
                </div>
              )}
              {selectedEffects.length > 0 && (
                <div style={{ fontWeight: 600, fontSize: 16 }}>特效：
                  <span style={{ color: '#333', fontWeight: 400, fontSize: 15 }}>
                    {selectedEffects.map(e => `【${getEffectLabel(e)}】`).join('、')}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <UploadPanel
            file={file}
            setFile={setFile}
            uploading={uploading}
            onUpload={handleUpload}
            taskId={taskId}
            onCheckStatus={checkStatus}
            error={error}
            status={status}
          />
          <ResultPanel result={result} />
        </div>
      </div>
    </div>
  )
}

export default App
