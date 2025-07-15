import React, { useState, useRef } from 'react';

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
);

const keyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const getStatusInfo = (status) => {
  switch (status) {
    case 'PENDING':
      return { 
        text: '处理中，请稍候...', 
        color: '#f59e0b',
        icon: <SpinnerIcon />
      };
    case 'UPLOADING':
      return {
        text: '上传文件中...',
        color: '#3b82f6',
        icon: <SpinnerIcon />
      };
    case 'SUCCESS':
      return { text: '✅ 处理成功', color: '#10b981' };
    case 'FAILURE':
      return { text: '❌ 处理失败', color: '#ef4444' };
    default:
      return { text: '尚未提交任务', color: '#6b7280' };
  }
};

export default function UploadUrlPanel({ 
  onUpload,
  taskId,
  status,
  error,
  presignedUrl
}) {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div style={{ background: '#fafbfc', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #ececec' }}>
      <style>{keyframes}</style>
      <div style={{ color: '#7c3aed', fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
        <span style={{ marginRight: 8, fontSize: 18 }}>⎯⎯</span>上传与处理
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <button
        onClick={() => fileInputRef.current.click()}
        style={{
          background: '#e9d5ff',
          color: '#7c3aed',
          border: '1px solid #d8b4fe',
          borderRadius: 4,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          marginRight: 8,
          transition: 'background 0.3s'
        }}
      >
        选择文件
      </button>
      
      {file && (
        <span style={{ marginLeft: 8, fontSize: 14 }}>
          已选择: {file.name} ({Math.round(file.size / 1024)} KB)
        </span>
      )}
      
      {file && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => onUpload(file)}
            disabled={status === 'PENDING' || status === 'UPLOADING'}
            style={{
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '10px 24px',
              fontSize: 16,
              fontWeight: 600,
              cursor: (status === 'PENDING' || status === 'UPLOADING') ? 'not-allowed' : 'pointer',
              opacity: (status === 'PENDING' || status === 'UPLOADING') ? 0.6 : 1,
              transition: 'background 0.3s, opacity 0.3s'
            }}
          >
            {status === 'UPLOADING' ? '上传中...' : '开始上传'}
          </button>
        </div>
      )}
      
      <div style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: 6, textAlign: 'center', marginTop: 16 }}>
        <b style={{ marginRight: 8, color: '#374151' }}>任务状态:</b>
        <span style={{ color: statusInfo.color, fontWeight: 600 }}>
          {statusInfo.icon}
          {statusInfo.text}
        </span>
      </div>
      
      {error && <div style={{ color: '#ef4444', marginTop: 12, fontWeight: 500, textAlign: 'center' }}>错误: {error}</div>}
    </div>
  );
}