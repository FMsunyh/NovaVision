import React, { useState } from 'react'

const features = [
  { key: 'dedup', label: '基础去重' },
  { key: 'mirrorflip', label: '镜像翻转' },
  { key: 'md5', label: '修改MD5' },
  { key: 'smart_capture', label: '智能抽帧' },
  { key: 'color', label: '智能调色' },
  { key: 'sharpen', label: '画面锐化' },
  { key: 'breakoffbothends', label: '掐头去尾' },
  { key: 'speedup', label: '随机加速' },
  { key: 'randommirror', label: '随机镜像' },
]

const effects = [
  '扫光', '泛光开幕', '下降开幕', '书单模式', '溶图模式', '横版三屏', '好物', '影视', '短剧', '探店'
]

function App() {
  const [file, setFile] = useState(null)
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [selectedEffects, setSelectedEffects] = useState([])
  const [taskId, setTaskId] = useState(null)
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFeatureChange = key => {
    setSelectedFeatures(f =>
      f.includes(key) ? f.filter(k => k !== key) : [...f, key]
    )
  }

  const handleEffectChange = effect => {
    setSelectedEffects(e =>
      e.includes(effect) ? e.filter(k => k !== effect) : [...e, effect]
    )
  }

  const handleUpload = async () => {
    setUploading(true)
    setError(null)
    setResult(null)
    setStatus(null)
    setTaskId(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('features', JSON.stringify(selectedFeatures))
      formData.append('effects', JSON.stringify(selectedEffects))
      const res = await fetch(`/api/upload`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('上传失败')
      const data = await res.json()
      setTaskId(data.task_id)
      setStatus('PENDING')
    } catch (e) {
      setError(e.message)
    }
    setUploading(false)
  }

  const checkStatus = async () => {
    if (!taskId) return
    setError(null)
    try {
      const res = await fetch(`/api/status/${taskId}`)
      if (!res.ok) throw new Error('查询失败')
      const data = await res.json()
      setStatus(data.status)
      if (data.status === 'SUCCESS') {
        setResult(`/result/${taskId}`)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <img src="/logo.svg" alt="logo" style={{ height: 40, marginRight: 16 }} />
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: 28 }}>NovaVision | 快速剪辑</h1>
      </div>
      <div style={{ display: 'flex', gap: 32 }}>
        {/* 左侧功能选择 */}
        <div style={{ flex: 1 }}>
          <h3>选择处理方式</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {features.map(f => (
              <label key={f.key} style={{ marginRight: 12, minWidth: 120 }}>
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(f.key)}
                  onChange={() => handleFeatureChange(f.key)}
                  style={{ marginRight: 6 }}
                />
                {f.label}
              </label>
            ))}
          </div>
          <h3 style={{ marginTop: 24 }}>选择特效</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {effects.map(e => (
              <label key={e} style={{ marginRight: 12, minWidth: 100 }}>
                <input
                  type="checkbox"
                  checked={selectedEffects.includes(e)}
                  onChange={() => handleEffectChange(e)}
                  style={{ marginRight: 6 }}
                />
                {e}
              </label>
            ))}
          </div>
        </div>
        {/* 右侧上传与结果 */}
        <div style={{ flex: 1, background: '#fafbfc', borderRadius: 8, padding: 24 }}>
          <h3>待剪辑视频</h3>
          <input type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} />
          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                background: '#4f7cff',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '8px 24px',
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? '上传中...' : '提交'}
            </button>
            {taskId && (
              <button
                onClick={checkStatus}
                style={{
                  marginLeft: 16,
                  background: '#eee',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 24px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                查询进度
              </button>
            )}
          </div>
          {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
          <div style={{ marginTop: 16 }}>
            <b>状态：</b>
            <span>{status ? status : '未提交'}</span>
          </div>
          {result && (
            <div style={{ marginTop: 24 }}>
              <video src={result} controls width="320" style={{ borderRadius: 8 }} />
              <div>
                <a href={result} download style={{ color: '#4f7cff', fontWeight: 600 }}>下载视频</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
