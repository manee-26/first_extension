import { useState, useEffect } from 'react'
import { toISO, parseISO, addDays, DOW } from '../utils/dateUtils'

const TODAY_STR = toISO(new Date())

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

export default function PlannerTable({ tasks, appStartDate, onToggleDay, onDeleteTask, onUpdateName }) {
  const [popover, setPopover] = useState(null)

  function handleCircleClick(e, task) {
    e.stopPropagation()
    if (popover?.task.id === task.id) { setPopover(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setPopover({ task, x: rect.left + rect.width / 2, y: rect.bottom + 8 })
  }

  useEffect(() => {
    if (!popover) return
    function close(e) {
      if (!e.target.closest('.prog-circle') && !e.target.closest('.prog-popover')) {
        setPopover(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [popover])

  if (!appStartDate) return null

  const isEmpty = tasks.length === 0
  const fallback = parseISO(appStartDate)

  // Global column start = earliest addedAt across all tasks
  const globalStart = isEmpty
    ? fallback
    : tasks.reduce((earliest, t) => {
        const d = parseISO(t.addedAt || appStartDate)
        return d < earliest ? d : earliest
      }, parseISO(tasks[0].addedAt || appStartDate))

  // Total columns = latest task end date from globalStart
  const colCount = isEmpty
    ? 7
    : Math.max(...tasks.map(t => {
        const ts = parseISO(t.addedAt || appStartDate)
        return daysBetween(globalStart, ts) + t.totalDays
      }))

  // Build column descriptors — includes isPast for auto-miss logic
  const columns = Array.from({ length: colCount }, (_, i) => {
    const d   = addDays(globalStart, i)
    const iso = toISO(d)
    return {
      index:   i,
      date:    d,
      dayName: DOW[d.getDay()],
      dateNum: d.getDate(),
      isToday: iso === TODAY_STR,
      isPast:  iso < TODAY_STR,   // strictly before today → missed if unchecked
    }
  })

  // Sort: completed tasks sink to bottom
  const sortedTasks = [...tasks].sort((a, b) => {
    const aDone = a.totalDays > 0 && a.checked.slice(0, a.totalDays).every(Boolean)
    const bDone = b.totalDays > 0 && b.checked.slice(0, b.totalDays).every(Boolean)
    if (aDone === bDone) return 0
    return aDone ? 1 : -1
  })

  return (
    <div className="table-wrapper">
      {isEmpty && (
        <div className="empty-state">
          <span>🗓️</span>
          <p>No tasks yet — click <strong>Add Task</strong> to begin!</p>
        </div>
      )}

      {!isEmpty && (
        <table className="planner-table">
          <thead>
            <tr>
              <th className="col-task">Task</th>
              <th className="col-prog" />
              {columns.map(col => (
                <th key={col.index}>
                  <div className={`th-day${col.isToday ? ' is-today' : ''}`}>
                    <span className="th-dayname">{col.dayName}</span>
                    <span className="th-date">{col.dateNum}</span>
                  </div>
                </th>
              ))}
              <th className="col-del" />
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map(task => {
              const taskStart   = parseISO(task.addedAt || appStartDate)
              const startOffset = daysBetween(globalStart, taskStart)
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  columns={columns}
                  startOffset={startOffset}
                  isActive={popover?.task.id === task.id}
                  onCircleClick={e => handleCircleClick(e, task)}
                  onToggle={i => onToggleDay(task.id, i)}
                  onDelete={() => onDeleteTask(task.id)}
                  onNameChange={name => onUpdateName(task.id, name)}
                />
              )
            })}
          </tbody>
        </table>
      )}

      {popover && <ProgressPopover task={popover.task} x={popover.x} y={popover.y} />}
    </div>
  )
}

/* ── Task row ─────────────────────────────────────── */
function TaskRow({ task, columns, startOffset, isActive, onCircleClick, onToggle, onDelete, onNameChange }) {
  const done    = task.checked.filter(Boolean).length
  const total   = task.totalDays
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = done === total && total > 0

  return (
    <tr className={allDone ? 'row-done' : ''}>
      <td className="col-task">
        <input
          className="task-input"
          type="text"
          placeholder="Task name…"
          value={task.name}
          onChange={e => onNameChange(e.target.value)}
        />
      </td>

      <td className="col-prog">
        <div
          className={`prog-circle${isActive ? ' prog-circle--active' : ''}`}
          onClick={onCircleClick}
          title={`${pct}% complete — click for details`}
        >
          <RingCircle pct={pct} />
        </div>
      </td>

      {columns.map(col => {
        const taskDayIndex = col.index - startOffset
        const inactive     = taskDayIndex < 0 || taskDayIndex >= total

        return (
          <td key={col.index} className={inactive ? 'cell-inactive' : ''}>
            {inactive
              ? <span className="cell-dash">—</span>
              : (
                <DayCell
                  checked={!!task.checked[taskDayIndex]}
                  isPast={col.isPast}
                  isToday={col.isToday}
                  onChange={() => onToggle(taskDayIndex)}
                />
              )
            }
          </td>
        )
      })}

      <td className="col-del">
        <button className="btn-del" title="Remove task" onClick={onDelete}>✕</button>
      </td>
    </tr>
  )
}

/* ── Day cell with 3 states ───────────────────────────
   ✓  done     — green,  past or present, checked
   ✕  missed   — red,    past only,       unchecked → click to mark done
   □  empty    — plain,  today or future, unchecked
─────────────────────────────────────────────────────── */
function DayCell({ checked, isPast, isToday, onChange }) {
  if (checked) {
    return (
      <div className="day-cell day-cell--done" onClick={onChange} title="Done — click to undo">
        ✓
      </div>
    )
  }
  // Unchecked + strictly past = missed
  if (isPast && !isToday) {
    return (
      <div className="day-cell day-cell--missed" onClick={onChange} title="Missed — click to mark done">
        ✕
      </div>
    )
  }
  // Today or future = normal empty cell
  return (
    <div
      className={`day-cell day-cell--empty${isToday ? ' day-cell--today' : ''}`}
      onClick={onChange}
      title={isToday ? 'Today' : 'Upcoming'}
    />
  )
}

/* ── SVG ring ─────────────────────────────────────── */
function RingCircle({ pct }) {
  const r      = 10
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const stroke = pct === 100 ? '#10b981' : pct >= 50 ? '#a78bfa' : '#7c3aed'

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ display: 'block' }}>
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        cx="14" cy="14" r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 14 14)"
        style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
      />
      <text x="14" y="14" textAnchor="middle" dominantBaseline="central"
            fontSize="6.5" fontWeight="700" fill="rgba(255,255,255,0.85)" fontFamily="inherit">
        {pct}%
      </text>
    </svg>
  )
}

/* ── Progress popover ─────────────────────────────── */
function ProgressPopover({ task, x, y }) {
  const done      = task.checked.filter(Boolean).length
  const total     = task.totalDays
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0
  const remaining = total - done
  const popW      = 220
  const left      = Math.min(Math.max(x - popW / 2, 6), 660 - popW - 6)

  return (
    <div className="prog-popover" style={{ left, top: y }}>
      <div className="ppop-header">
        <span className="ppop-name">{task.name || 'Untitled'}</span>
        <span className="ppop-pct">{pct}%</span>
      </div>
      <div className="ppop-track">
        <div className="ppop-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="ppop-stats">
        <div className="ppop-stat">
          <span className="ppop-stat-val">{done}</span>
          <span className="ppop-stat-lbl">Done</span>
        </div>
        <div className="ppop-divider" />
        <div className="ppop-stat">
          <span className="ppop-stat-val">{remaining}</span>
          <span className="ppop-stat-lbl">Left</span>
        </div>
        <div className="ppop-divider" />
        <div className="ppop-stat">
          <span className="ppop-stat-val">{total}</span>
          <span className="ppop-stat-lbl">Total</span>
        </div>
      </div>
    </div>
  )
}
