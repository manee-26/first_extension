export default function Header({ onAddClick }) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="logo">📋</span>
        <div>
          <h1 className="app-title">Planova</h1>
          <p className="app-tagline">Plan. Focus. Achieve.</p>
        </div>
      </div>
      <button className="btn-add" onClick={onAddClick}>＋ Add Task</button>
    </header>
  )
}
