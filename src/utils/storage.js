/**
 * ─────────────────────────────────────────────────────
 *  WHY chrome.storage.local (not cookies or localStorage)?
 *
 *  ❌ Cookies        – 4 KB limit, designed for HTTP, not extensions
 *  ❌ localStorage   – tied to the popup page, ~5 MB, can be cleared
 *                      by Chrome when storage pressure is high
 *  ✅ chrome.storage.local
 *                    – up to 10 MB, persists until the extension is
 *                      uninstalled, survives browser restarts,
 *                      officially recommended for extensions
 *
 *  We fall back to localStorage only during local dev (npm run dev)
 *  where the chrome API isn't available.
 * ─────────────────────────────────────────────────────
 */

const KEY            = 'plannerV3'
const RETENTION_DAYS = 30          // tasks older than this are auto-removed

// ── Read ──────────────────────────────────────────────
export function loadData(cb) {
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    chrome.storage.local.get([KEY], r => cb(r[KEY] || {}))
  } else {
    try {
      cb(JSON.parse(localStorage.getItem(KEY) || '{}'))
    } catch {
      cb({})
    }
  }
}

// ── Write ─────────────────────────────────────────────
export function saveData(data) {
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    chrome.storage.local.set({ [KEY]: data })
  } else {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Planner: localStorage write failed', e)
    }
  }
}

// ── Prune tasks older than RETENTION_DAYS ────────────
// A task is "expired" only if:
//   • it has an addedAt date AND
//   • addedAt + totalDays + RETENTION_DAYS < today
//   (we keep it while it's still within its tracking window + 30 day buffer)
export function pruneExpiredTasks(tasks) {
  const now = Date.now()
  return tasks.filter(task => {
    if (!task.addedAt) return true          // legacy tasks without timestamp → keep
    const addedMs  = new Date(task.addedAt).getTime()
    const windowMs = (task.totalDays + RETENTION_DAYS) * 24 * 60 * 60 * 1000
    return now - addedMs < windowMs
  })
}
