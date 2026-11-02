"use client";
import { useEffect, useRef, useState } from "react";

type Quest = { id: string; title: string; side: boolean; xp: number };
type Profile = { name: string; xp: number; quests: Quest[]; completions: Record<string, boolean>; today: string; selectedDay: string };

export default function Journey() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedDay, setSelectedDay] = useState(localDay(new Date()));
  const followsToday = useRef(true);
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [title, setTitle] = useState("");
  const [side, setSide] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const res = await fetch(`/api/profile?timezone=${encodeURIComponent(timezone)}&date=${selectedDay}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json() as Profile;
      setProfile(data);
      if (followsToday.current && selectedDay !== data.today) {
        setSelectedDay(data.today);
        setMonth(new Date(`${data.today}T12:00:00`));
      }
    } else setError("Could not load your quest log.");
  }
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 60000);
    return () => window.clearInterval(timer);
  }, [selectedDay]);

  async function action(payload: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) setError(data.error); else setProfile((old) => old ? { ...old, ...data } : old);
    } catch { setError("Unable to save. Try again."); } finally { setBusy(false); }
  }

  const rank = profile ? `Wayfinder ${Math.min(3, Math.floor(profile.xp / 300) + 1)}` : "Wayfinder I";
  const days = calendarCells(month);
  const today = profile?.today || localDay(new Date());
  return <main className="journey">
    <header className="journey-head"><a className="brand" href="/">✳ dayward<span className="brand-period">.</span></a><div className="rank-pill">✦ {rank} <span>{profile?.xp || 0} XP</span></div></header>
    <section className="journey-hero"><div><div className="eyebrow">YOUR WORLD / TODAY</div><p className="journey-date">{profile ? formatDay(profile.today) : "YOUR NEW DAY"}</p><h1>Hi, <em>{profile?.name?.split(" ")[0] || "Adventurer"}.</em></h1><p className="story-copy">Small steps make the biggest stories. Your quests are ready.</p></div><div className="journey-orb"><span>✦</span></div></section>
    <section className="quest-board">
      <Calendar month={month} days={days} selected={selectedDay} today={today} onSelect={(day) => { followsToday.current = day === today; setSelectedDay(day); }} onMonth={setMonth}/>
      <div className="quest-header"><div><div className="eyebrow">{selectedDay === today ? "TODAY’S QUEST LOG" : "QUEST LOG"}</div><h2>Your next small wins</h2></div><div className="quest-count">{Object.values(profile?.completions || {}).filter(Boolean).length} COMPLETE</div></div>
      {error && <p className="form-message">{error}</p>}{!profile && <p className="story-copy">Loading your quest log…</p>}
      <div className="quest-items">{profile?.quests.filter((q) => !q.side).map((quest) => <QuestRow key={quest.id} quest={quest} done={Boolean(profile.completions?.[quest.id])} onToggle={() => action({ action: "toggle", id: quest.id, day: selectedDay })} onDelete={() => action({ action: "delete", id: quest.id, day: selectedDay })} busy={busy || selectedDay > today}/>)}</div>
      <div className="side-heading"><div><div className="eyebrow">OPTIONAL EXTRAS</div><h3>Side quests</h3></div></div>
      <div className="quest-items">{profile?.quests.filter((q) => q.side).map((quest) => <QuestRow key={quest.id} quest={quest} done={Boolean(profile.completions?.[quest.id])} onToggle={() => action({ action: "toggle", id: quest.id, day: selectedDay })} onDelete={() => action({ action: "delete", id: quest.id, day: selectedDay })} busy={busy || selectedDay > today}/>)}</div>
      <form className="add-quest" onSubmit={async (e) => { e.preventDefault(); if (!title.trim()) return; await action({ action: "add", title, side, day: selectedDay }); setTitle(""); }}><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} placeholder="Add a quest for today…"/><label><input type="checkbox" checked={side} onChange={(e) => setSide(e.target.checked)}/> Side quest</label><button disabled={busy || !title.trim()}>＋ Add quest</button></form>
      <p className="day-note">✧ Your quest checklist refreshes each day. Your XP stays with you.</p>
    </section>
  </main>;
}

function Calendar({ month, days, selected, today, onSelect, onMonth }: { month: Date; days: (string | null)[]; selected: string; today: string; onSelect: (day: string) => void; onMonth: (month: Date) => void }) {
  return <div className="calendar-panel"><div className="calendar-top"><div><div className="eyebrow">YOUR DAYS</div><h3>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3></div><div className="calendar-nav"><button onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">‹</button><button onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">›</button></div></div>
    <div className="calendar-grid"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>{days.map((day, index) => day ? <button key={index} className={`${selected === day ? "selected " : ""}${day === today ? "today" : ""}`} onClick={() => onSelect(day)} disabled={day > today}>{Number(day.slice(-2))}</button> : <i key={index}/>)}</div>
    <button className="today-link" onClick={() => { onSelect(today); onMonth(new Date(`${today}T12:00:00`)); }}>Return to today · Viewing {formatDay(selected)}</button></div>;
}

function QuestRow({ quest, done, onToggle, onDelete, busy }: { quest: Quest; done: boolean; onToggle: () => void; onDelete: () => void; busy: boolean }) {
  return <article className={`quest-row${done ? " complete" : ""}`}><button className="quest-check" aria-label={done ? "Mark incomplete" : "Complete quest"} onClick={onToggle} disabled={busy}>{done ? "✓" : ""}</button><div className="quest-title">{quest.title}<small>{quest.side ? "SIDE QUEST" : "MAIN QUEST"}</small></div><span className="quest-xp">✦ {quest.xp} XP</span><button className="delete-quest" title="Delete quest" aria-label="Delete quest" onClick={onDelete} disabled={busy}>×</button></article>;
}

function localDay(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatDay(day: string) { return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
function calendarCells(month: Date) { const leading = (month.getDay() + 6) % 7; const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...Array(leading).fill(null), ...Array.from({ length: count }, (_, index) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`)]; }

