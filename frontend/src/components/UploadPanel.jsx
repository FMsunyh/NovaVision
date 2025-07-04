import React from 'react'

export default function UploadPanel({ file, setFile, uploading, onUpload, taskId, onCheckStatus, error, status }) {
  return (
    <div style={{ background: '#fafbfc', borderRadius: 8, padding: 24, marginBottom: 24 }}>
      <h3>待剪辑视频</h3>
      <input type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} />
      <div style={{ marginTop: 16 }}>
        <button
          onClick={onUpload}
          disabled={!file || uploading}
          style={{
            background: '#4f7cff',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '8px 24px',
            fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
            marginRight: 16
          }}
        >
          {uploading ? '上传中...' : '提交'}
        </button>
        {taskId && (
          <button
            onClick={onCheckStatus}
            style={{
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
    </div>
  )
}
