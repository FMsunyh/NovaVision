import React from 'react'

const features = [
  { key: 'dedup', label: '基础去重', enabled: true },
  { key: 'mirrorflip', label: '镜像翻转', enabled: true },
  { key: 'md5', label: '修改MD5', enabled: true },
  { key: 'smart_capture', label: '智能抽帧', enabled: false },
  { key: 'color', label: '智能调色', enabled: false },
  { key: 'sharpen', label: '画面锐化', enabled: false },
  { key: 'breakoffbothends', label: '掐头去尾', enabled: true },
  { key: 'speedup', label: '随机加速', enabled: false },
  { key: 'randommirror', label: '随机镜像', enabled: false },
  { key: 'randomrotation', label: '随机旋转', enabled: true },
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
              color: !f.enabled ? '#bbb' : selected.includes(f.key) ? '#fff' : '#333',
              fontWeight: 500,
              cursor: f.enabled ? 'pointer' : 'not-allowed',
              marginRight: 8,
              marginBottom: 8,
              opacity: f.enabled ? 1 : 0.5
            }}
            onClick={() => f.enabled && toggle(f.key)}
            type="button"
            disabled={!f.enabled}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
