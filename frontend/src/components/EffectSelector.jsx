import React from 'react'

const effects = [
  { label: '扫光', enabled: true },
  { label: '泛光开幕', enabled: false },
  { label: '下降开幕', enabled: false },
  { label: '书单模式', enabled: false },
  { label: '溶图模式', enabled: false },
  { label: '横版三屏', enabled: false },
  { label: '好物', enabled: false },
  { label: '影视', enabled: false },
  { label: '短剧', enabled: false },
  { label: '探店', enabled: false },
]

export default function EffectSelector({ selected, onChange }) {
  const toggle = effect =>
    onChange(selected.includes(effect) ? [] : [effect])
  return (
    <div style={{ marginBottom: 24 }}>
      <h3>选择特效</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {effects.map(e => (
          <button
            key={e.label}
            style={{
              minWidth: 100,
              padding: '8px 16px',
              border: selected.includes(e.label) ? '2px solid #4f7cff' : '1px solid #e0e0e0',
              borderRadius: 6,
              background: selected.includes(e.label) ? '#4f7cff' : '#fff',
              color: !e.enabled ? '#bbb' : selected.includes(e.label) ? '#fff' : '#333',
              fontWeight: 500,
              cursor: e.enabled ? 'pointer' : 'not-allowed',
              marginRight: 8,
              marginBottom: 8,
              opacity: e.enabled ? 1 : 0.5
            }}
            onClick={() => e.enabled && toggle(e.label)}
            type="button"
            disabled={!e.enabled}
          >
            {e.label}
          </button>
        ))}
      </div>
    </div>
  )
}
