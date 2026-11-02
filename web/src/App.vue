<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";

const SAVE_KEY = "dayward-vue-v1";
const todayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const legacyQuestIds = new Set(["m1", "m2", "m3", "m4", "s1", "s2"]);
const makeDefaults = () => ({
  xp: 0,
  quests: [
    { id: "daily-steps", title: "Daily 10K Steps", category: "MOVE & EXPLORE", xp: 75, side: false },
    { id: "water-3l", title: "Drink 3L Water", category: "FUEL YOUR BODY", xp: 50, side: false },
    { id: "dsa-practice", title: "DSA Practice", category: "SHARPEN YOUR MIND", xp: 100, side: false },
    { id: "gym-running", title: "Gym / Running", category: "BUILD YOUR STRENGTH", xp: 100, side: false },
    { id: "ai-learning", title: "AI Learning", category: "FUTURE SKILLS", xp: 75, side: false },
    { id: "no-sugar", title: "No Sugar Today", category: "MINDFUL FUEL", xp: 40, side: true },
    { id: "no-junk", title: "Skip Junk Food", category: "SMART CHOICES", xp: 40, side: true },
    { id: "book-reading", title: "Read a Book", category: "LIFELONG LEARNING", xp: 40, side: true },
    { id: "football", title: "Play Football", category: "PLAY & RECOVER", xp: 40, side: true },
  ],
  days: {},
  dayXp: {},
});
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved && Array.isArray(saved.quests) && saved.days && typeof saved.xp === "number") {
      const defaults = makeDefaults();
      const defaultIds = new Set(defaults.quests.map(quest => quest.id));
      const savedQuests = saved.quests.filter(quest => !legacyQuestIds.has(quest.id));
      const seededQuests = defaults.quests.map(template => savedQuests.find(quest => quest.id === template.id) ?? template);
      const customQuests = savedQuests.filter(quest => !defaultIds.has(quest.id));
      return { ...defaults, ...saved, quests: [...seededQuests, ...customQuests] };
    }
  } catch { /* start fresh if local data is unavailable */ }
  return makeDefaults();
}

const state = reactive(loadState());
const selectedDate = ref(todayKey());
const dayPulse = ref(0);
const calendarMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const activeView = ref("today");
const showQuestForm = ref(false);
const newTitle = ref("");
const newSide = ref(false);
const newXp = ref(50);
const toast = ref("");
const introVisible = ref(true);
let toastTimeout;
let midnightCheck;
let introTimeout;

watch(state, value => localStorage.setItem(SAVE_KEY, JSON.stringify(value)), { deep: true });
const mainQuests = computed(() => state.quests.filter(quest => !quest.side));
const sideQuests = computed(() => state.quests.filter(quest => quest.side));
const completions = computed(() => state.days[selectedDate.value] || {});
const completedMain = computed(() => mainQuests.value.filter(quest => completions.value[quest.id]).length);
const completedToday = computed(() => Object.values(completions.value).filter(Boolean).length);
const allMainDone = (day) => mainQuests.value.length > 0 && mainQuests.value.every(quest => state.days[day]?.[quest.id]);
const currentStreak = computed(() => {
  dayPulse.value;
  let cursor = new Date();
  const today = todayKey();
  if (!allMainDone(today)) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (allMainDone(todayKey(cursor))) { count += 1; cursor.setDate(cursor.getDate() - 1); }
  return count;
});
const adventureRank = computed(() => {
  const ranks = ["Wayfinder I", "Wayfinder II", "Wayfinder III", "Pathfinder I", "Trailblazer I", "Trailblazer II", "Trailblazer III", "Warden I", "Warden II", "Warden III"];
  if (state.xp >= 3000) return `Vanguard ${Math.floor((state.xp - 3000) / 300) + 1}`;
  return ranks[Math.min(Math.floor(state.xp / 300), ranks.length - 1)];
});
const xpToNext = computed(() => 300 - (state.xp % 300));
const dateHeading = computed(() => formatDate(selectedDate.value, { weekday: "long", month: "long", day: "numeric" }));
const monthHeading = computed(() => calendarMonth.value.toLocaleDateString(undefined, { month: "long", year: "numeric" }));
const calendarDays = computed(() => {
  const month = calendarMonth.value;
  const leading = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [...Array(leading).fill(null), ...Array.from({ length: count }, (_, index) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`)];
});
const lastSeven = computed(() => Array.from({ length: 7 }, (_, index) => {
  const day = new Date(); day.setHours(12, 0, 0, 0); day.setDate(day.getDate() - (6 - index));
  const key = todayKey(day);
  const done = Object.values(state.days[key] || {}).filter(Boolean).length;
  return { key, short: day.toLocaleDateString(undefined, { weekday: "short" }), done, xp: state.dayXp[key] || 0 };
}));
const weeklyXp = computed(() => lastSeven.value.reduce((sum, day) => sum + day.xp, 0));
const weeklyDone = computed(() => lastSeven.value.reduce((sum, day) => sum + day.done, 0));
const weeklyPossible = computed(() => Math.max(1, mainQuests.value.length * 7));
const weeklyRate = computed(() => Math.min(100, Math.round(weeklyDone.value / weeklyPossible.value * 100)));
const totalCompleted = computed(() => Object.values(state.days).reduce((total, day) => total + Object.values(day).filter(Boolean).length, 0));
const activeDays = computed(() => Object.values(state.days).filter(day => Object.values(day).some(Boolean)).length);
const bestStreak = computed(() => {
  const keys = Object.keys(state.days).sort();
  let best = 0; let run = 0; let previous = "";
  for (const key of keys) {
    if (!allMainDone(key)) { run = 0; previous = key; continue; }
    const day = new Date(`${key}T12:00:00`); const prev = previous ? new Date(`${previous}T12:00:00`) : null;
    run = prev && (day - prev) / 86400000 === 1 ? run + 1 : 1;
    best = Math.max(best, run); previous = key;
  }
  return best;
});
const maxBar = computed(() => Math.max(50, ...lastSeven.value.map(day => day.xp)));

function formatDate(key, options = {}) {
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, options);
}
function selectDay(key) {
  if (key && key <= todayKey()) selectedDate.value = key;
}
function changeMonth(offset) {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + offset, 1);
}
function toggleQuest(quest) {
  if (selectedDate.value > todayKey()) return;
  if (!state.days[selectedDate.value]) state.days[selectedDate.value] = {};
  if (!state.dayXp[selectedDate.value]) state.dayXp[selectedDate.value] = 0;
  const wasDone = Boolean(state.days[selectedDate.value][quest.id]);
  state.days[selectedDate.value][quest.id] = !wasDone;
  const change = wasDone ? -quest.xp : quest.xp;
  state.xp = Math.max(0, state.xp + change);
  state.dayXp[selectedDate.value] = Math.max(0, state.dayXp[selectedDate.value] + change);
  notify(wasDone ? `Quest reopened · −${quest.xp} XP` : `Quest complete · +${quest.xp} XP`);
}
function addQuest() {
  const title = newTitle.value.trim();
  if (!title) return;
  state.quests.push({ id: `quest-${Date.now()}`, title, category: newSide.value ? "A little extra" : "Your routine", xp: Number(newXp.value), side: newSide.value });
  newTitle.value = ""; newSide.value = false; newXp.value = 50; showQuestForm.value = false;
  notify("Quest added to your log.");
}
function deleteQuest(quest) {
  if (!window.confirm(`Delete “${quest.title}”? XP already earned stays on your rank.`)) return;
  state.quests = state.quests.filter(item => item.id !== quest.id);
  notify("Quest removed.");
}
function notify(message) {
  toast.value = message;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toast.value = ""; }, 2200);
}
function handleNewDay() {
  dayPulse.value += 1;
  const today = todayKey();
  if (selectedDate.value !== today) selectedDate.value = today;
  if (calendarMonth.value.getMonth() !== new Date().getMonth() || calendarMonth.value.getFullYear() !== new Date().getFullYear()) calendarMonth.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}
onMounted(() => {
  midnightCheck = window.setInterval(handleNewDay, 30_000);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) introVisible.value = false;
  else introTimeout = window.setTimeout(() => { introVisible.value = false; }, 3000);
});
onUnmounted(() => { clearInterval(midnightCheck); clearTimeout(toastTimeout); clearTimeout(introTimeout); });
</script>

<template>
  <div class="app-frame">
    <Transition name="intro"><div v-if="introVisible" class="intro-screen" role="status" aria-label="A twinkling Milky Way over a field of planets">
      <div class="intro-sky"><div class="galaxy-stars"></div><i class="galaxy-nebula nebula-blue"></i><i class="galaxy-nebula nebula-violet"></i><i class="galaxy-nebula nebula-rose"></i></div>
      <div class="intro-brand"><span>✳</span> DAYNOVA</div>
      <div class="galaxy-stage" aria-hidden="true">
        <div class="galaxy-halo"></div><div class="star-orbit orbit-far"></div><div class="star-orbit orbit-near"></div>
        <div class="planet planet-large"><i></i></div><div class="planet planet-small"></div><div class="planet planet-ember"></div><div class="planet planet-indigo"></div><div class="planet planet-ice"></div>
        <div class="moonlet"></div>
        <i class="sparkle sparkle-a">✦</i><i class="sparkle sparkle-b">✧</i><i class="sparkle sparkle-c">·</i><i class="sparkle sparkle-d">✦</i>
      </div>
      <div class="intro-caption"><span>YOUR NEXT ADVENTURE AWAITS</span><strong>Make every day a new orbit.</strong><small>Preparing your next quest…</small></div>
      <button class="intro-skip" @click="introVisible = false">Skip intro <span>↗</span></button>
    </div></Transition>
    <div class="ambient ambient-a"></div><div class="ambient ambient-b"></div>
    <aside class="sidebar">
      <a class="brand" href="#today" @click.prevent="activeView = 'today'"><span class="brand-mark">✳</span> daynova<span class="brand-dot">.</span></a>
      <div class="nav-caption">YOUR JOURNEY</div>
      <nav class="nav-stack" aria-label="Main navigation">
        <button :class="['nav-item', { active: activeView === 'today' }]" @click="activeView = 'today'"><span class="nav-icon">◈</span> Today <span class="nav-count">{{ mainQuests.length - completedMain }}</span></button>
        <button :class="['nav-item', { active: activeView === 'analytics' }]" @click="activeView = 'analytics'"><span class="nav-icon">⌁</span> Analytics</button>
      </nav>
      <div class="sidebar-bottom">
        <div class="rank-mini"><div class="rank-mini-top"><span>ADVENTURE RANK</span><span>✦</span></div><strong>{{ adventureRank }}</strong><div class="rank-xp">{{ state.xp }} XP <span>· {{ xpToNext }} to next rank</span></div><div class="rank-track"><i :style="{ width: `${(state.xp % 300) / 3}%` }"></i></div></div>
        <div class="sidebar-user"><div class="avatar">A</div><div><strong>Aditya</strong><small>YOUR PERSONAL LOG</small></div><span class="online-dot"></span></div>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar"><div class="crumb">YOUR WORLD <span>/</span> <strong>{{ activeView === 'today' ? 'TODAY' : 'ANALYTICS' }}</strong></div><div class="topbar-right"><div class="streak-pill"><span class="streak-flame">✦</span><strong>{{ currentStreak }}</strong><span>day streak</span></div><div class="top-avatar">A</div></div></header>

      <section class="welcome-row"><div><p class="eyebrow">{{ dateHeading.toUpperCase() }}</p><h1>Hi, <em>Aditya.</em></h1><p class="welcome-sub">One small win at a time. Your next chapter is yours to write.</p></div><button class="primary-button" @click="showQuestForm = !showQuestForm"><span>＋</span> New quest</button></section>

      <section class="rank-banner">
        <div class="rank-copy"><div class="banner-label"><span>✧</span> YOUR ADVENTURE RANK</div><h2>{{ adventureRank }}</h2><p>Every little win moves you forward.</p><div class="banner-xp"><strong>{{ state.xp }} <small>XP</small></strong><span>•</span><span>{{ xpToNext }} XP to your next rank</span></div><div class="banner-track"><span :style="{ width: `${(state.xp % 300) / 3}%` }"></span></div><div class="banner-foot"><span>✧ Progress at your pace.</span><span>{{ state.xp % 300 }} / 300 XP</span></div></div>
        <div class="orbit-art" aria-hidden="true"><div class="breath-ring ring-one"></div><div class="breath-ring ring-two"></div><div class="orbit orbit-outer"></div><div class="orbit orbit-inner"></div><div class="planet"></div><div class="katana-scene"><div class="katana"><i class="blade"></i><i class="guard"></i><i class="handle"></i><i class="pommel"></i></div></div><span class="orbit-star one">✦</span><span class="orbit-star two">✧</span><span class="orbit-star three">·</span><span class="planet-label">BREATH OF THE COSMOS</span></div>
      </section>

      <section v-if="activeView === 'today'" class="content-grid">
        <div class="primary-column">
          <div class="section-heading"><div><div class="heading-line"><h2>{{ selectedDate === todayKey() ? 'Today’s quests' : 'Quest log' }}</h2><span class="count-chip">{{ completedMain }} / {{ mainQuests.length }} MAIN</span></div><p>Small steps make the biggest stories.</p></div><button class="subtle-button" @click="activeView = 'analytics'">View analytics <span>↗</span></button></div>
          <div v-if="showQuestForm" class="quest-form glass-panel"><div class="form-heading"><div><small>ADD TO YOUR ADVENTURE</small><h3>Make it a quest.</h3></div><button class="close-button" aria-label="Close" @click="showQuestForm = false">×</button></div><form @submit.prevent="addQuest"><label>Quest name<input v-model="newTitle" maxlength="60" placeholder="e.g. Take a 20 minute walk" required autofocus /></label><div class="form-row"><label>Quest type<select v-model="newSide"><option :value="false">Main quest</option><option :value="true">Side quest</option></select></label><label>XP reward<select v-model="newXp"><option :value="25">25 XP · Easy</option><option :value="50">50 XP · Steady</option><option :value="75">75 XP · Stretch</option></select></label></div><button class="primary-button form-submit">Add to my quest log <span>→</span></button></form></div>
          <div class="quest-list">
            <article v-for="quest in mainQuests" :key="quest.id" :class="['quest-card', { completed: completions[quest.id] }]">
              <button class="quest-check" :disabled="selectedDate > todayKey()" :aria-label="completions[quest.id] ? 'Mark incomplete' : 'Complete quest'" @click="toggleQuest(quest)">{{ completions[quest.id] ? '✓' : '' }}</button>
              <div class="quest-text"><span class="quest-category">{{ quest.category }}</span><strong>{{ quest.title }}</strong><small>◷ &nbsp;Whenever works for you</small></div>
              <span class="quest-reward">✦ &nbsp;{{ quest.xp }} XP</span><button class="delete-button" aria-label="Delete quest" title="Delete quest" @click="deleteQuest(quest)">×</button>
            </article>
            <div v-if="!mainQuests.length" class="empty-state">Your main quest list is clear. Add a small goal when you’re ready.</div>
          </div>

          <div class="section-heading side-section"><div><div class="heading-line"><h2>Side quests</h2><span class="side-spark">✧</span></div><p>Bonus XP for the little things that make life yours.</p></div><button class="text-button" @click="showQuestForm = true; newSide = true">＋ Add side quest</button></div>
          <div class="quest-list side-list">
            <article v-for="quest in sideQuests" :key="quest.id" :class="['quest-card', 'side-card', { completed: completions[quest.id] }]">
              <button class="quest-check" :disabled="selectedDate > todayKey()" :aria-label="completions[quest.id] ? 'Mark incomplete' : 'Complete quest'" @click="toggleQuest(quest)">{{ completions[quest.id] ? '✓' : '' }}</button>
              <div class="quest-text"><strong>{{ quest.title }}</strong><small>◷ &nbsp;{{ quest.category }}</small></div>
              <span class="quest-reward">✦ &nbsp;{{ quest.xp }} XP</span><button class="delete-button" aria-label="Delete side quest" @click="deleteQuest(quest)">×</button>
            </article>
            <button class="add-side-card" @click="showQuestForm = true; newSide = true"><span>＋</span> Add a little side quest</button>
          </div>
        </div>

        <aside class="right-column">
          <section class="glass-panel calendar-panel"><div class="card-top"><div><span class="card-label">YOUR DAYS</span><h3>{{ monthHeading }}</h3></div><div class="month-controls"><button aria-label="Previous month" @click="changeMonth(-1)">‹</button><button aria-label="Next month" @click="changeMonth(1)">›</button></div></div><div class="calendar-grid"><span v-for="(day, index) in ['M','T','W','T','F','S','S']" :key="index">{{ day }}</span><i v-for="(day, index) in calendarDays" :key="index"><button v-if="day" :class="{ selected: selectedDate === day, today: day === todayKey(), 'has-progress': Object.values(state.days[day] || {}).some(Boolean) }" :disabled="day > todayKey()" @click="selectDay(day)">{{ Number(day.slice(-2)) }}<b v-if="Object.values(state.days[day] || {}).some(Boolean)"></b></button></i></div><div class="calendar-foot"><span><i></i> Day with progress</span><button @click="selectDay(todayKey())">Today ↗</button></div></section>
          <section class="glass-panel summary-panel"><div class="card-top"><div><span class="card-label">TODAY’S MOMENTUM</span><h3>A little progress</h3></div><span class="summary-icon">◌</span></div><div class="summary-progress"><div class="donut" :style="{ '--progress': `${mainQuests.length ? completedMain / mainQuests.length * 100 : 0}%` }"><strong>{{ mainQuests.length ? Math.round(completedMain / mainQuests.length * 100) : 0 }}<small>%</small></strong></div><div><strong>{{ completedToday }} quests done</strong><span>{{ completedMain }} of {{ mainQuests.length }} main quests</span></div></div><div class="mini-stat"><span>XP today</span><strong>+{{ state.dayXp[selectedDate] || 0 }} <small>XP</small></strong></div></section>
        </aside>
      </section>

      <section v-else class="analytics-view">
        <div class="section-heading"><div><div class="heading-line"><h2>Your analytics</h2><span class="count-chip">LAST 7 DAYS</span></div><p>A clear view of your consistency and progress.</p></div><button class="subtle-button" @click="activeView = 'today'">← Back to today</button></div>
        <div class="analytics-cards"><article class="glass-panel metric-card"><span class="metric-icon cyan">✦</span><small>TOTAL XP</small><strong>{{ state.xp }}</strong><span class="metric-note">Adventure rank progress</span></article><article class="glass-panel metric-card"><span class="metric-icon blue">♨</span><small>CURRENT STREAK</small><strong>{{ currentStreak }} <i>days</i></strong><span class="metric-note">Best streak: {{ bestStreak }} days</span></article><article class="glass-panel metric-card"><span class="metric-icon violet">◈</span><small>QUESTS COMPLETED</small><strong>{{ totalCompleted }}</strong><span class="metric-note">Across {{ activeDays }} active days</span></article><article class="glass-panel metric-card"><span class="metric-icon teal">⌁</span><small>WEEKLY COMPLETION</small><strong>{{ weeklyRate }}<i>%</i></strong><span class="metric-note">{{ weeklyDone }} wins this week</span></article></div>
        <div class="analytics-grid"><section class="glass-panel chart-panel"><div class="card-top"><div><span class="card-label">YOUR RHYTHM</span><h3>XP earned this week</h3></div><span class="chart-total">{{ weeklyXp }} <small>XP</small></span></div><div class="chart"><div v-for="day in lastSeven" :key="day.key" class="chart-column"><span class="bar-value">{{ day.xp || '' }}</span><div class="bar-rail"><i :style="{ height: `${Math.max(day.xp ? 9 : 2, day.xp / maxBar * 100)}%` }"></i></div><small>{{ day.short }}</small></div></div></section>
          <section class="glass-panel insight-panel"><span class="card-label">A NOTE FOR YOU</span><div class="insight-orb">✧</div><h3>{{ currentStreak ? 'You’re finding your rhythm.' : 'Your next streak starts today.' }}</h3><p>{{ totalCompleted ? `You’ve collected ${totalCompleted} small wins so far. Keep the pace that feels right.` : 'Every adventure starts with a first step. Pick one small quest and begin.' }}</p><button class="text-button" @click="activeView = 'today'">See today’s quests ↗</button></section></div>
      </section>
      <footer class="page-footer"><span>✳</span> Your pace is the right pace. Keep going.</footer>
    </main>
    <div v-if="toast" class="toast-message" role="status">{{ toast }}</div>
  </div>
</template>

