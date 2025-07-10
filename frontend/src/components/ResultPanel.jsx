import React from 'react'

export default function ResultPanel({ result }) {
  if (!result) return null
  
  // 判断是否为OSS链接
  const isOSSUrl = result.includes('aliyuncs.com')
  
  return (
    <div style={{ background: '#fafbfc', borderRadius: 8, padding: 24, marginTop: 24 }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
        {isOSSUrl ? '🌐 处理完成（云端存储）' : '📁 处理完成（本地文件）'}
      </h3>
      <video 
        src={result} 
        controls 
        width="320" 
        style={{ borderRadius: 8, marginBottom: 16 }}
        crossOrigin="anonymous"
      />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <a 
          href={result} 
          download 
          style={{ 
            color: '#4f7cff', 
            fontWeight: 600,
            textDecoration: 'none',
            padding: '8px 16px',
            border: '2px solid #4f7cff',
            borderRadius: 4,
            background: 'white'
          }}
        >
          📥 下载视频
        </a>
        {isOSSUrl && (
          <span style={{ 
            fontSize: 12, 
            color: '#666',
            background: '#e8f4ff',
            padding: '4px 8px',
            borderRadius: 4
          }}>
            ⏰ 链接24小时内有效
          </span>
        )}
      </div>
      {isOSSUrl && (
        <div style={{ 
          marginTop: 12, 
          fontSize: 12, 
          color: '#888',
          lineHeight: 1.4
        }}>
          💡 文件已上传到云端存储，可直接分享此链接
        </div>
      )}
    </div>
  )
}
