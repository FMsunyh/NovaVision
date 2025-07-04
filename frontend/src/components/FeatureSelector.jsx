import React from 'react'

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

export default function FeatureSelector({ selected, onChange }) {
  const toggle = key =>
    onChange(selected.includes(key)
      ? selected.filter(k => k !== key)
      : [...selected, key])
  return (
    <div style={{ marginBottom: 24 }}>
      <h3>选择处理方式</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {features.map(f => (
          <button
            key={f.key}
            style={{
              minWidth: 100,
              padding: '8px 16px',
              border: selected.includes(f.key) ? '2px solid #4f7cff' : '1px solid #e0e0e0',
              borderRadius: 6,
              background: selected.includes(f.key) ? '#4f7cff' : '#fff',
              color: selected.includes(f.key) ? '#fff' : '#333',
              fontWeight: 500,
              cursor: 'pointer',
              marginRight: 8,
              marginBottom: 8
            }}
            onClick={() => toggle(f.key)}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
