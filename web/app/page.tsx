"use client";

import { FormEvent, useMemo, useState } from "react";
import { signIn } from "next-auth/react";

type Mode = "login" | "signup";
export default function Home() {
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const passwordChecks = useMemo(() => [password.length >= 12, /[a-z]/.test(password) && /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)], [password]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setBusy(true);
    try {
      if (mode === "signup") {
        if (password !== confirm) { setMessage("Passwords do not match."); return; }
        const response = await fetch("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
        const data = await response.json();
        if (!response.ok) { setMessage(data.error || "Could not create your account."); return; }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) setMessage(mode === "signup" ? "Account created, but sign in failed. Please log in." : "Email or password is incorrect.");
      else window.location.assign("/journey");
    } catch { setMessage("Could not connect. Please try again."); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell"><div className="nebula nebula-one"/><div className="nebula nebula-two"/><header className="topbar"><a className="brand" href="#"><span className="brand-symbol">✳</span> dayward<span className="brand-period">.</span></a><span className="top-note"><i/> YOUR NEXT CHAPTER STARTS HERE</span></header>
    <section className="auth-layout"><div className="story"><div className="eyebrow"><span>✦</span> YOUR LIFE, IN PROGRESS</div><h1>Make today<br/>part of your <em>story.</em></h1><p className="story-copy">Turn the things you want to do into quests worth showing up for.</p><div className="orbit-scene" aria-hidden="true"><div className="orbit-ring ring-a"/><div className="orbit-ring ring-b"/><div className="planet"/><span className="float-star star-1">✦</span><span className="float-star star-2">✧</span><span className="float-star star-3">·</span><div className="orbit-caption">ONE SMALL WIN AT A TIME</div></div><div className="promise"><span>✧</span> Progress at your pace. No lost XP. No guilt.</div></div>
      <section className="auth-card"><div className="card-glyph">✧</div><div className="card-kicker">WELCOME TO DAYWARD</div><h2>{mode === "login" ? "Continue your journey" : "Begin your journey"}</h2><p className="card-copy">{mode === "login" ? "Your next quest is waiting." : "Create your account and start at Wayfinder I."}</p>
        <div className="mode-tabs" role="tablist"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setMessage("");}}>Log in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => {setMode("signup");setMessage("");}}>Sign up</button></div>
        <div className="social-row"><button type="button" className="social-button" onClick={() => signIn("google", { callbackUrl: "/journey" })}><span className="google-mark">G</span> Google</button><button type="button" className="social-button" onClick={() => signIn("discord", { callbackUrl: "/journey" })}><span className="discord-mark">◉</span> Discord</button></div>
        <div className="separator"><span/>OR WITH EMAIL<span/></div>
        <form onSubmit={submit} className="auth-form" noValidate>{mode === "signup" && <label>Your name<input autoComplete="name" placeholder="What should we call you?" value={name} onChange={e=>setName(e.target.value)} maxLength={70} required/></label>}<label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "login" ? "Enter your password" : "At least 12 characters"} value={password} onChange={e=>setPassword(e.target.value)} minLength={mode === "signup" ? 12 : 1} required/></label>
          {mode === "signup" && <><div className="password-rules">{["12 characters", "Upper & lowercase", "One number", "One symbol"].map((rule,i)=><span className={passwordChecks[i] ? "met" : ""} key={rule}><b>{passwordChecks[i] ? "✓" : "·"}</b>{rule}</span>)}</div><label>Confirm password<input type="password" autoComplete="new-password" placeholder="Enter your password again" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label></>}
          {message && <div className="form-message" role="alert">{message}</div>}<button className="submit-button" disabled={busy}>{busy ? "Opening your world…" : mode === "login" ? "Enter Dayward" : "Create my account"}<span>↗</span></button></form>
        <p className="privacy-note"><span>▣</span> Your progress is private and saved to your account.</p>
      </section></section><footer className="page-foot"><span>✳ DAYWARD</span><span>BUILT FOR THE LIFE YOU WANT TO LIVE</span></footer>
  </main>;
}

