import React, { useState } from 'react'
import FeatureSelector from './components/FeatureSelector'
import EffectSelector from './components/EffectSelector'
import UploadPanel from './components/UploadPanel'
import ResultPanel from './components/ResultPanel'


function App() {
  const [file, setFile] = useState(null)
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [selectedEffects, setSelectedEffects] = useState([])
  const [taskId, setTaskId] = useState(null)
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

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
        <div style={{ flex: 1 }}>
          <FeatureSelector selected={selectedFeatures} onChange={setSelectedFeatures} />
          <EffectSelector selected={selectedEffects} onChange={setSelectedEffects} />
        </div>
        <div style={{ flex: 1 }}>
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
