import React from 'react'

const effects = [
  '扫光', '泛光开幕', '下降开幕', '书单模式', '溶图模式', '横版三屏', '好物', '影视', '短剧', '探店'
]

export default function EffectSelector({ selected, onChange }) {
  const toggle = effect =>
    onChange(selected.includes(effect)
      ? selected.filter(e => e !== effect)
      : [...selected, effect])
  return (
    <div style={{ marginBottom: 24 }}>
      <h3>选择特效</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {effects.map(e => (
          <button
            key={e}
            style={{
              minWidth: 100,
              padding: '8px 16px',
              border: selected.includes(e) ? '2px solid #4f7cff' : '1px solid #e0e0e0',
              borderRadius: 6,
              background: selected.includes(e) ? '#4f7cff' : '#fff',
              color: selected.includes(e) ? '#fff' : '#333',
              fontWeight: 500,
              cursor: 'pointer',
              marginRight: 8,
              marginBottom: 8
            }}
            onClick={() => toggle(e)}
            type="button"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
