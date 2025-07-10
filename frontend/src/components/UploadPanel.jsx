import React from 'react'

// 为了避免重复定义，我们将Spinner的JSX和CSS分开
const SpinnerIcon = () => (
  <span style={{
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid currentColor',
    borderRightColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: 8,
    verticalAlign: 'middle'
  }}></span>
)

// 在组件外部定义 keyframes，避免在每次渲染时重新创建
const keyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

// 在组件中使用
const getStatusInfo = (status) => {
  switch (status) {
    case 'PENDING':
      return { 
        text: '处理中，请稍候...', 
        color: '#f59e0b',
        icon: <SpinnerIcon />
      }
    case 'SUCCESS':
      return { text: '✅ 处理成功', color: '#10b981' }
    case 'FAILURE':
      return { text: '❌ 处理失败', color: '#ef4444' }
    default:
      return { text: '尚未提交任务', color: '#6b7280' }
  }
}

export default function UploadPanel({ file, setFile, uploading, onUpload, taskId, onCheckStatus, error, status }) {
  const statusInfo = getStatusInfo(status)

  return (
    <div style={{ background: '#fafbfc', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #ececec' }}>
      <style>{keyframes}</style>
      <div style={{ color: '#7c3aed', fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
        <span style={{ marginRight: 8, fontSize: 18 }}>⎯⎯</span>上传与处理
      </div>
      <input 
        type="file" 
        accept="video/*" 
        onChange={e => setFile(e.target.files[0])} 
        style={{
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 16,
          padding: '8px 12px',
          border: '1px dashed #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          background: 'white'
        }}
      />
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button
          onClick={onUpload}
          disabled={!file || uploading || status === 'PENDING'}
          style={{
            background: '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '10px 24px',
            fontSize: 16,
            fontWeight: 600,
            cursor: (!file || uploading || status === 'PENDING') ? 'not-allowed' : 'pointer',
            opacity: (!file || uploading || status === 'PENDING') ? 0.6 : 1,
            transition: 'background 0.3s, opacity 0.3s'
          }}
        >
          {uploading ? '上传中...' : '开始处理'}
        </button>
        <div style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: 6, flexGrow: 1, textAlign: 'center' }}>
          <b style={{ marginRight: 8, color: '#374151' }}>任务状态:</b>
          <span style={{ color: statusInfo.color, fontWeight: 600 }}>
            {statusInfo.icon}
            {statusInfo.text}
          </span>
        </div>
      </div>
      {error && <div style={{ color: '#ef4444', marginTop: 12, fontWeight: 500, textAlign: 'center' }}>错误: {error}</div>}
    </div>
  )
}
