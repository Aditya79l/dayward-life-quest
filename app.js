const STORAGE_KEY = 'dayward-save-v1';
const rankSteps = [
  { min: 0, name: 'Wayfinder', numeral: 'I', next: 'Wayfinder II', cap: 300 },
  { min: 300, name: 'Wayfinder', numeral: 'II', next: 'Wayfinder III', cap: 600 },
  { min: 600, name: 'Wayfinder', numeral: 'III', next: 'Pathfinder', cap: 900 },
  { min: 900, name: 'Pathfinder', numeral: 'I', next: 'Trailblazer', cap: 1200 },
  { min: 1200, name: 'Trailblazer', numeral: 'I', next: 'Trailblazer II', cap: 1500 },
  { min: 1500, name: 'Trailblazer', numeral: 'II', next: 'Trailblazer III', cap: 1800 },
  { min: 1800, name: 'Trailblazer', numeral: 'III', next: 'Warden', cap: 2100 },
  { min: 2100, name: 'Warden', numeral: 'I', next: 'Warden II', cap: 2400 },
  { min: 2400, name: 'Warden', numeral: 'II', next: 'Warden III', cap: 2700 },
  { min: 2700, name: 'Warden', numeral: 'III', next: 'Vanguard', cap: 3000 },
];

function previousDayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}

function initialWeek() {
  const days = Array(7).fill(false);
  const todayMondayFirst = (new Date().getDay() + 6) % 7;
  for (let offset = 1; offset <= 4; offset++) days[(todayMondayFirst - offset + 7) % 7] = true;
  return days;
}

const initialState = () => ({
  date: todayKey(),
  selectedDate: todayKey(),
  days: { [todayKey()]: {} },
  xp: 640,
  streak: 4,
  lastFullDay: previousDayKey(),
  week: initialWeek(),
  quests: [
    { id: 'q1', title: 'Make the bed & open the curtains', category: 'Morning ritual', kind: 'life', time: '5 min', xp: 25, side: false, completed: false },
    { id: 'q2', title: 'Move your body a little', category: 'Body & energy', kind: 'body', time: '20 min', xp: 50, side: false, completed: false },
    { id: 'q3', title: 'Focus on your most important task', category: 'Work & craft', kind: 'work', time: '45 min', xp: 75, side: false, completed: false },
    { id: 'q4', title: 'Read a few pages', category: 'Mind & growth', kind: 'mind', time: '15 min', xp: 25, side: false, completed: false },
    { id: 'q5', title: 'Wind down without a screen', category: 'Mind & growth', kind: 'mind', time: '15 min', xp: 50, side: false, completed: false },
    { id: 's1', title: 'Step outside for fresh air', category: 'A little extra', kind: 'life', time: '10 min', xp: 25, side: true, completed: false },
    { id: 's2', title: 'Send someone a kind message', category: 'A little extra', kind: 'life', time: '2 min', xp: 25, side: true, completed: false },
  ],
});

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.quests)) return initialState();
    if (!saved.days) {
      const legacyDate = saved.date || todayKey();
      saved.days = { [legacyDate]: Object.fromEntries(saved.quests.map(quest => [quest.id, Boolean(quest.completed)])) };
    }
    saved.selectedDate ||= todayKey();
    return { ...initialState(), ...saved };
  } catch {
    return initialState();
  }
}

let state = loadState();
let calendarMonth = dateFromKey(state.selectedDate);
calendarMonth.setDate(1);
let toastTimer;
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getCompletions(key = state.selectedDate) {
  if (!state.days[key]) state.days[key] = {};
  return state.days[key];
}

function isCompleted(quest, key = state.selectedDate) {
  return Boolean(state.days[key]?.[quest.id]);
}

function currentRank() {
  if (state.xp >= 3000) {
    const tier = Math.floor((state.xp - 3000) / 300);
    const min = 3000 + tier * 300;
    return { min, cap: min + 300, name: 'Vanguard', numeral: String(tier + 1), next: `Vanguard ${tier + 2}`, percent: (state.xp - min) / 300 * 100 };
  }
  const step = rankSteps.findLast(item => state.xp >= item.min) || rankSteps[0];
  return { ...step, percent: Math.max(0, Math.min(100, state.xp / step.cap * 100)) };
}

function render() {
  const mainQuests = state.quests.filter(quest => !quest.side);
  const sideQuests = state.quests.filter(quest => quest.side);
  const completed = mainQuests.filter(quest => isCompleted(quest)).length;
  const rank = currentRank();
  const displayRank = `${rank.name} <span>${rank.numeral}</span>`;
  const progress = `${rank.percent}%`;
  $('#sidebar-xp').textContent = state.xp;
  $('#sidebar-next').textContent = rank.cap;
  $('#sidebar-progress').style.width = progress;
  $('#hero-xp').textContent = state.xp;
  $('#hero-next').textContent = rank.cap;
  $('#hero-progress').style.width = progress;
  $('#hero-percent').textContent = `${Math.round(rank.percent)}%`;
  document.querySelector('.rank-name').innerHTML = displayRank;
  document.querySelector('.rank-next span:last-child').textContent = rank.next;
  document.querySelector('.hero-copy h2').innerHTML = displayRank;
  $('#streak-count').textContent = state.streak;
  $('#rhythm-streak').textContent = state.streak;
  $('#quest-count').textContent = `${completed} / ${mainQuests.length}`;
  $('#nav-count').textContent = `${mainQuests.length - completed}`;
  $('#quest-caption').textContent = completed === mainQuests.length && mainQuests.length > 0
    ? 'All quests complete. Take a moment to enjoy it.'
    : completed ? `${mainQuests.length - completed} more ${mainQuests.length - completed === 1 ? 'quest' : 'quests'} whenever you’re ready.` : 'One thing at a time. You’ve got this.';
  $('#quest-list').innerHTML = mainQuests.length ? mainQuests.map(questMarkup).join('') : '<div class="empty-state"><div><b>Your quest log is clear.</b>Add a quest when you’re ready for one.</div></div>';
  $('#side-list').innerHTML = sideQuests.length ? sideQuests.map(questMarkup).join('') : '<div class="empty-state"><div><b>No side quests yet.</b>Leave room for a little surprise.</div></div>';
  const selected = dateFromKey(state.selectedDate);
  const isToday = state.selectedDate === todayKey();
  const selectedLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(selected);
  $('#date-label').textContent = selectedLabel.toUpperCase();
  $('#quest-heading').textContent = isToday ? 'Today’s quests' : `${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(selected)} quests`;
  $('#greeting').innerHTML = isToday ? 'A new day, <span>Adventurer.</span>' : `${escapeHtml(new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(selected))}, <span>Adventurer.</span>`;
  $('#quest-caption').textContent = completed === mainQuests.length && mainQuests.length > 0
    ? 'All quests complete. Take a moment to enjoy it.'
    : completed ? `${mainQuests.length - completed} more ${mainQuests.length - completed === 1 ? 'quest' : 'quests'} whenever you’re ready.` : 'One thing at a time. You’ve got this.';
  $('#quest-list').setAttribute('aria-label', `${selectedLabel} quests`);
  renderCalendar();
  const today = new Date();
  const mondayFirstToday = (today.getDay() + 6) % 7;
  $('#week-strip').innerHTML = state.week.map((done, index) => `<span class="week-day${done ? ' done' : ''}${index === mondayFirstToday ? ' today' : ''}" aria-label="${done ? 'Completed' : 'Open'}"></span>`).join('');
  save();
}

function questMarkup(quest) {
  const categoryClass = { body: 'category-body', mind: 'category-mind', work: 'category-work', life: 'category-life' }[quest.kind] || 'category-life';
  const completed = isCompleted(quest);
  const future = state.selectedDate > todayKey();
  return `<article class="quest-card${completed ? ' completed' : ''}${quest.side ? ' side-item' : ''}">
    <button class="quest-check" data-toggle="${escapeHtml(quest.id)}" aria-label="${future ? 'Quest is scheduled for a future date' : completed ? 'Mark incomplete' : 'Complete quest'}" aria-pressed="${completed}"${future ? ' disabled' : ''}>${completed ? '✓' : ''}</button>
    <div class="quest-copy"><div class="quest-category ${categoryClass}">${escapeHtml(quest.category)}</div><div class="quest-name">${escapeHtml(quest.title)}</div><div class="quest-meta"><span>◷ &nbsp;${escapeHtml(quest.time)}</span></div></div>
    <span class="quest-xp">✦ &nbsp;${quest.xp} XP</span>
    <button class="quest-delete" data-delete="${escapeHtml(quest.id)}" aria-label="Delete ${quest.side ? 'side quest' : 'quest'}: ${escapeHtml(quest.title)}" title="Delete quest">×</button>
  </article>`;
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  $('#calendar-month').textContent = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(calendarMonth);
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: leading }, () => '<span class="calendar-empty"></span>');
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const selected = key === state.selectedDate;
    const today = key === todayKey();
    const hasProgress = state.quests.some(quest => isCompleted(quest, key));
    cells.push(`<button type="button" class="calendar-day${selected ? ' selected' : ''}${today ? ' today' : ''}${hasProgress ? ' has-progress' : ''}" data-date="${key}" aria-pressed="${selected}" aria-label="${escapeHtml(new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(dateFromKey(key)))}"><span>${day}</span>${hasProgress ? '<i></i>' : ''}</button>`);
  }
  $('#calendar-grid').innerHTML = cells.join('');
  $('#calendar-selected').textContent = `Viewing ${new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(dateFromKey(state.selectedDate))}`;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function toggleQuest(id) {
  if (state.selectedDate > todayKey()) { showToast('Future quests are not complete yet.'); return; }
  const quest = state.quests.find(item => item.id === id);
  if (!quest) return;
  const wasCompleted = isCompleted(quest);
  getCompletions()[id] = !wasCompleted;
  state.xp = Math.max(0, state.xp + (wasCompleted ? -quest.xp : quest.xp));
  if (state.selectedDate === todayKey() && !quest.side && state.quests.filter(item => !item.side).every(item => isCompleted(item))) {
    if (state.lastFullDay !== todayKey()) {
      state.streak = state.lastFullDay === previousDayKey() ? state.streak + 1 : Math.max(1, state.streak);
      state.lastFullDay = todayKey();
      state.week[(new Date().getDay() + 6) % 7] = true;
    }
  }
  render();
  showToast(!wasCompleted ? `Quest complete · +${quest.xp} XP` : `Quest reopened · −${quest.xp} XP`);
}

function deleteQuest(id) {
  const quest = state.quests.find(item => item.id === id);
  if (!quest) return;
  if (!window.confirm(`Delete this ${quest.side ? 'side quest' : 'quest'}? XP you already earned will stay on your rank.`)) return;
  state.quests = state.quests.filter(item => item.id !== id);
  Object.values(state.days).forEach(completions => { delete completions[id]; });
  render();
  showToast(quest.side ? 'Side quest deleted.' : 'Quest deleted.');
}

function openModal(side = false) {
  $('#quest-type').value = side ? 'side' : 'main';
  $('#quest-modal').classList.add('open');
  $('#quest-modal').setAttribute('aria-hidden', 'false');
  setTimeout(() => $('#quest-title').focus(), 100);
}

function closeModal() {
  $('#quest-modal').classList.remove('open');
  $('#quest-modal').setAttribute('aria-hidden', 'true');
}

document.addEventListener('click', event => {
  const remove = event.target.closest('[data-delete]');
  if (remove) { deleteQuest(remove.dataset.delete); return; }
  const day = event.target.closest('[data-date]');
  if (day) {
    state.selectedDate = day.dataset.date;
    calendarMonth = dateFromKey(state.selectedDate);
    calendarMonth.setDate(1);
    render();
    return;
  }
  const toggle = event.target.closest('[data-toggle]');
  if (toggle) toggleQuest(toggle.dataset.toggle);
  const nav = event.target.closest('[data-view]');
  if (nav) {
    event.preventDefault();
    document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link === nav));
    const view = nav.dataset.view;
    $('#breadcrumb-current').textContent = view === 'home' ? 'TODAY' : view.toUpperCase();
    if (view === 'progress') document.querySelector('.rhythm-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    else $('#home').scrollIntoView({ behavior: 'smooth' });
  }
});

$('#open-modal').addEventListener('click', () => openModal());
$('#add-side').addEventListener('click', () => openModal(true));
$('#calendar-prev').addEventListener('click', () => { calendarMonth.setMonth(calendarMonth.getMonth() - 1); renderCalendar(); });
$('#calendar-next').addEventListener('click', () => { calendarMonth.setMonth(calendarMonth.getMonth() + 1); renderCalendar(); });
$('#view-all').addEventListener('click', () => { $('#quest-list').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
$('#close-modal').addEventListener('click', closeModal);
$('#quest-modal').addEventListener('click', event => { if (event.target === $('#quest-modal')) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
$('#quest-form').addEventListener('submit', event => {
  event.preventDefault();
  const title = $('#quest-title').value.trim();
  if (!title) return;
  const side = $('#quest-type').value === 'side';
  const xp = Number($('#quest-xp').value);
  state.quests.push({ id: `q-${Date.now()}`, title, category: side ? 'A little extra' : 'My quest', kind: 'life', time: 'Whenever works', xp, side, completed: false });
  render();
  $('#quest-form').reset();
  closeModal();
  showToast('Quest added to your adventure.');
});

render();

