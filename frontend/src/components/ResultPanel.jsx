import React from 'react'

export default function ResultPanel({ result }) {
  if (!result) return null
  return (
    <div style={{ background: '#fafbfc', borderRadius: 8, padding: 24, marginTop: 24 }}>
      <video src={result} controls width="320" style={{ borderRadius: 8 }} />
      <div>
        <a href={result} download style={{ color: '#4f7cff', fontWeight: 600 }}>下载视频</a>
      </div>
    </div>
  )
}
