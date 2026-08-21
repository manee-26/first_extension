/* ════════════════════════════════════════════════
   Planner Extension — popup.js

   Data model stored in chrome.storage.local:
   {
     appStartDate: "YYYY-MM-DD",   ← set ONCE, never changes
     tasks: [
       {
         id: string,
         name: string,
         totalDays: number,         ← chosen per task in modal
         checked: boolean[]         ← checked[i] = day (appStartDate + i) done?
       }
     ]
   }

   Table columns = max(totalDays across all tasks), min 7.
   Column i header = appStartDate + i (shows day name + date number).
   Cells beyond a task's totalDays are dimmed & non-interactive.
════════════════════════════════════════════════ */

const STORAGE_KEY = 'plannerV3';
const DOW_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Helpers ──────────────────────────────────────
function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(dateObj, n) {
  const d = new Date(dateObj.getTime());
  d.setDate(d.getDate() + n);
  return d;
}
function pad(n) { return String(n).padStart(2, '0'); }

// ── Storage ──────────────────────────────────────
function load(cb) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get([STORAGE_KEY], r => cb(r[STORAGE_KEY] || {}));
  } else {
    cb(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  }
}
function save() {
  const data = { appStartDate, tasks };
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ [STORAGE_KEY]: data });
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

// ── State ─────────────────────────────────────────
let appStartDate = '';   // ISO string, set once
let tasks        = [];
let selectedDays = 7;

// ── DOM refs ─────────────────────────────────────
const overlay       = document.getElementById('overlay');
const addBtn        = document.getElementById('addBtn');
const btnCancel     = document.getElementById('btnCancel');
const btnConfirm    = document.getElementById('btnConfirm');
const modalName     = document.getElementById('modalName');
const customDaysInp = document.getElementById('customDays');
const daysNumLabel  = document.getElementById('daysNumLabel');
const presetsEl     = document.getElementById('presets');
const startDateLbl  = document.getElementById('startDateLabel');
const headerRow     = document.getElementById('headerRow');
const taskBody      = document.getElementById('taskBody');
const emptyState    = document.getElementById('emptyState');
const progressLbl   = document.getElementById('progressLbl');
const progressPctEl = document.getElementById('progressPct');
const progressFill  = document.getElementById('progressFill');

// ── Boot ─────────────────────────────────────────
load(data => {
  // Set appStartDate once (first ever use)
  appStartDate = data.appStartDate || toISO(new Date());
  tasks        = data.tasks || [];

  // If we just created the start date, persist it
  if (!data.appStartDate) save();

  // Show start date in header
  const sd = parseISO(appStartDate);
  startDateLbl.textContent =
    `Since ${DOW_SHORT[sd.getDay()]}, ${sd.getDate()} ${MONTHS_SHORT[sd.getMonth()]} ${sd.getFullYear()}`;

  rebuildTable();
});

// ════════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════════
function openModal() {
  modalName.value      = '';
  customDaysInp.value  = '';
  selectedDays         = 7;
  daysNumLabel.textContent = 7;
  presetsEl.querySelectorAll('.preset')
    .forEach((b, i) => b.classList.toggle('active', i === 0));
  overlay.classList.remove('hidden');
  setTimeout(() => modalName.focus(), 50);
}
function closeModal() { overlay.classList.add('hidden'); }

addBtn.addEventListener('click', openModal);
btnCancel.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

// Preset buttons
presetsEl.addEventListener('click', e => {
  const btn = e.target.closest('.preset');
  if (!btn) return;
  presetsEl.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  customDaysInp.value = '';
  setDays(parseInt(btn.dataset.val));
});

// Custom input
customDaysInp.addEventListener('input', () => {
  const v = parseInt(customDaysInp.value);
  if (v >= 1 && v <= 365) {
    presetsEl.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
    setDays(v);
  }
});
function setDays(n) {
  selectedDays = n;
  daysNumLabel.textContent = n;
}

// Confirm
btnConfirm.addEventListener('click', doAddTask);
modalName.addEventListener('keydown', e => { if (e.key === 'Enter') doAddTask(); });

function doAddTask() {
  const name = modalName.value.trim();
  if (!name) { modalName.focus(); return; }

  const task = {
    id: Date.now().toString(),
    name,
    totalDays: selectedDays,
    checked: new Array(selectedDays).fill(false)
  };
  tasks.push(task);
  save();
  closeModal();
  rebuildTable(); // rebuild so columns resize if needed
}

// ════════════════════════════════════════════════
// TABLE BUILDER
// ════════════════════════════════════════════════
function colCount() {
  return tasks.length > 0
    ? Math.max(...tasks.map(t => t.totalDays))
    : 7;
}

function rebuildTable() {
  const cols    = colCount();
  const start   = parseISO(appStartDate);
  const todayStr = toISO(new Date());

  /* ── Header row ── */
  // Keep first <th class="col-task"> and last <th class="col-del">
  // Remove all dynamic day-column headers in between
  const existingThs = Array.from(headerRow.children);
  existingThs.slice(1, existingThs.length - 1).forEach(th => th.remove());

  // Insert day headers before the last <th>
  const lastTh = headerRow.lastElementChild;
  for (let i = 0; i < cols; i++) {
    const d    = addDays(start, i);
    const iso  = toISO(d);
    const th   = document.createElement('th');
    const div  = document.createElement('div');
    div.className = 'th-day' + (iso === todayStr ? ' is-today' : '');

    const nameSpan = document.createElement('span');
    nameSpan.className   = 'th-dayname';
    nameSpan.textContent = DOW_SHORT[d.getDay()];

    const dateSpan = document.createElement('span');
    dateSpan.className   = 'th-date';
    dateSpan.textContent = d.getDate();

    div.append(nameSpan, dateSpan);
    th.appendChild(div);
    headerRow.insertBefore(th, lastTh);
  }

  /* ── Body rows ── */
  taskBody.innerHTML = '';
  tasks.forEach(task => taskBody.appendChild(buildRow(task, cols, start, todayStr)));

  updateEmptyState();
  updateProgress();
}

function buildRow(task, cols, startDate, todayStr) {
  const tr = document.createElement('tr');

  // Task name cell
  const tdName = document.createElement('td');
  tdName.className = 'col-task';
  const inp = document.createElement('input');
  inp.type        = 'text';
  inp.className   = 'task-input';
  inp.placeholder = 'Task name…';
  inp.value       = task.name;
  inp.addEventListener('input', () => { task.name = inp.value; save(); });
  tdName.appendChild(inp);
  tr.appendChild(tdName);

  // Day cells
  for (let i = 0; i < cols; i++) {
    const td  = document.createElement('td');
    const d   = addDays(startDate, i);
    const iso = toISO(d);

    if (i >= task.totalDays) {
      // Beyond this task's tracking range → dim cell
      td.className = 'cell-inactive';
      td.innerHTML = '<span style="color:rgba(255,255,255,0.08);font-size:11px">—</span>';
    } else {
      if (iso === todayStr) td.classList.add('today-col');
      const cb = document.createElement('input');
      cb.type      = 'checkbox';
      cb.className = 'day-check';
      cb.checked   = !!task.checked[i];
      cb.addEventListener('change', () => {
        task.checked[i] = cb.checked;
        save();
        updateRowStyle(tr, task);
        updateProgress();
      });
      td.appendChild(cb);
    }
    tr.appendChild(td);
  }

  // Delete cell
  const tdDel = document.createElement('td');
  tdDel.className = 'col-del';
  const delBtn = document.createElement('button');
  delBtn.className   = 'btn-del';
  delBtn.title       = 'Remove task';
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => t.id !== task.id);
    save();
    rebuildTable(); // columns may shrink
  });
  tdDel.appendChild(delBtn);
  tr.appendChild(tdDel);

  updateRowStyle(tr, task);
  return tr;
}

function updateRowStyle(tr, task) {
  const allDone = task.checked.slice(0, task.totalDays).every(Boolean);
  tr.classList.toggle('row-done', allDone);
}

// ════════════════════════════════════════════════
// EMPTY STATE
// ════════════════════════════════════════════════
function updateEmptyState() {
  const hasTasks = tasks.length > 0;
  emptyState.classList.toggle('hidden', hasTasks);
  document.getElementById('plannerTable').style.display = hasTasks ? '' : 'none';
}

// ════════════════════════════════════════════════
// PROGRESS BAR
// ════════════════════════════════════════════════
function updateProgress() {
  const total = tasks.reduce((s, t) => s + t.totalDays, 0);
  const done  = tasks.reduce((s, t) => s + t.checked.filter(Boolean).length, 0);
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  progressLbl.textContent   = `${done} / ${total} completed`;
  progressPctEl.textContent = `${pct}%`;
  progressFill.style.width  = `${pct}%`;
}
