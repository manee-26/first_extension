import { useState, useEffect, useRef } from 'react'

const PRESETS = [7, 14, 21, 30]

export default function AddTaskModal({ onAdd, onClose }) {
  const [name,       setName]       = useState('')
  const [days,       setDays]       = useState(7)
  const [customVal,  setCustomVal]  = useState('')
  const [activePreset, setActivePreset] = useState(7)
  const nameRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  function pickPreset(val) {
    setActivePreset(val)
    setDays(val)
    setCustomVal('')
  }

  function handleCustomChange(e) {
    const v = parseInt(e.target.value)
    setCustomVal(e.target.value)
    if (v >= 1 && v <= 365) {
      setDays(v)
      setActivePreset(null)
    }
  }

  function handleConfirm() {
    if (!name.trim()) { nameRef.current?.focus(); return }
    onAdd(name.trim(), days)
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <span>📋</span>
          <h2 className="modal-title">Add New Task</h2>
        </div>

        {/* Task name */}
        <div className="form-group">
          <label className="form-label">Task Name</label>
          <input
            ref={nameRef}
            className="form-input"
            type="text"
            placeholder="e.g. Morning Run, Study, Read…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            autoComplete="off"
          />
        </div>

        {/* Days to track */}
        <div className="form-group">
          <label className="form-label">Days to Track</label>
          <div className="presets">
            {PRESETS.map(p => (
              <button
                key={p}
                className={`preset${activePreset === p ? ' active' : ''}`}
                onClick={() => pickPreset(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="custom-row">
            <span className="form-label" style={{ margin: 0 }}>Custom:</span>
            <input
              className="custom-inp"
              type="number"
              min="1"
              max="365"
              placeholder="e.g. 45"
              value={customVal}
              onChange={handleCustomChange}
            />
            <span className="form-label" style={{ margin: 0 }}>days</span>
          </div>
          <p className="days-hint">
            Tracking <strong>{days}</strong> days from your start date
          </p>
        </div>

        {/* Actions */}
        <div className="modal-btns">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-confirm" onClick={handleConfirm}>Add Task</button>
        </div>
      </div>
    </div>
  )
}
