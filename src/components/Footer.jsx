export default function Footer({ tasks }) {
  const total = tasks.reduce((s, t) => s + t.totalDays, 0)
  const done  = tasks.reduce((s, t) => s + t.checked.filter(Boolean).length, 0)
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <footer className="footer">
      <div className="progress-row">
        <span>{done} / {total} completed</span>
        <span className="pct">{pct}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </footer>
  )
}
