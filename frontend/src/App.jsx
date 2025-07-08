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
        setResult(`/api/result/${taskId}`)
      }
    } catch (e) {
      setError(e.message)
    }
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
          {/* 新增：已选择的处理方式和特效展示卡片，放在待剪辑视频上方 */}
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

// 新增：特征key转中文label方法
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
function getFeatureLabel(key) {
  return featureLabels[key] || key
}

// 新增：特效key转中文label方法
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
};
function getEffectLabel(key) {
  return effectLabels[key] || key;
}

export default App
