import { useState, useEffect } from 'react'
import { loadData, saveData, pruneExpiredTasks } from './utils/storage'
import { toISO } from './utils/dateUtils'
import Header       from './components/Header'
import AddTaskModal from './components/AddTaskModal'
import PlannerTable from './components/PlannerTable'
import Footer       from './components/Footer'

export default function App() {
  const [appStartDate, setAppStartDate] = useState('')
  const [tasks,        setTasks]        = useState([])
  const [showModal,    setShowModal]    = useState(false)

  // ── Load from storage once on mount ────────────────
  useEffect(() => {
    loadData(data => {
      const startDate = data.appStartDate || toISO(new Date())

      // Prune any tasks older than their tracking window + 30-day buffer
      const liveTasks = pruneExpiredTasks(data.tasks || [])

      setAppStartDate(startDate)
      setTasks(liveTasks)

      // Persist initial state (and pruned result) if needed
      if (!data.appStartDate || liveTasks.length !== (data.tasks || []).length) {
        saveData({ appStartDate: startDate, tasks: liveTasks })
      }
    })
  }, [])

  // ── Persist helper ──────────────────────────────────
  function persist(nextTasks) {
    setTasks(nextTasks)
    saveData({ appStartDate, tasks: nextTasks })
  }

  // ── Task actions ────────────────────────────────────
  function addTask(name, totalDays) {
    const task = {
      id:        Date.now().toString(),
      name,
      totalDays,
      checked:   new Array(totalDays).fill(false),
      addedAt:   toISO(new Date()),   // ← timestamp for 30-day retention tracking
    }
    persist([...tasks, task])
  }

  function deleteTask(id) {
    persist(tasks.filter(t => t.id !== id))
  }

  function toggleDay(taskId, dayIndex) {
    persist(tasks.map(t => {
      if (t.id !== taskId) return t
      const checked = [...t.checked]
      checked[dayIndex] = !checked[dayIndex]
      return { ...t, checked }
    }))
  }

  function updateTaskName(taskId, name) {
    persist(tasks.map(t => t.id === taskId ? { ...t, name } : t))
  }

  return (
    <div className="app">
      {showModal && (
        <AddTaskModal
          onAdd={(name, days) => { addTask(name, days); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
      <Header onAddClick={() => setShowModal(true)} />
      <PlannerTable
        tasks={tasks}
        appStartDate={appStartDate}
        onToggleDay={toggleDay}
        onDeleteTask={deleteTask}
        onUpdateName={updateTaskName}
      />
      <Footer tasks={tasks} />
    </div>
  )
}
