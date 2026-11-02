import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { db } from "@/lib/mongodb";

type Quest = { id: string; title: string; side: boolean; xp: number };
type Profile = { userId: ObjectId; xp: number; rank: string; quests: Quest[]; days: Record<string, Record<string, boolean>>; timezone: string };
const defaults = [
  { id: "seed-morning", title: "Make the bed and open the curtains", side: false, xp: 25 },
  { id: "seed-move", title: "Move your body a little", side: false, xp: 50 },
  { id: "seed-focus", title: "Focus on your most important task", side: false, xp: 75 },
  { id: "seed-read", title: "Read a few pages", side: true, xp: 25 },
];
const dateKey = (date: Date, timeZone: string) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !ObjectId.isValid(session.user.id)) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = new ObjectId(session.user.id);
  const requestedZone = new URL(request.url).searchParams.get("timezone") || "UTC";
  let timezone = "UTC";
  try { if (requestedZone.length > 80) throw new Error("Invalid timezone"); new Intl.DateTimeFormat("en", { timeZone: requestedZone }); timezone = requestedZone; } catch { /* keep UTC for invalid client values */ }
  const profiles = db.collection<Profile>("profiles");
  await profiles.createIndex({ userId: 1 }, { unique: true });
  let profile = await profiles.findOne({ userId });
  if (!profile) {
    const fresh: Profile = { userId, xp: 0, rank: "Wayfinder I", quests: defaults, days: {}, timezone };
    const inserted = await profiles.insertOne(fresh);
    profile = { ...fresh, _id: inserted.insertedId };
  } else if (!Array.isArray(profile.quests) || profile.quests.length === 0) {
    await profiles.updateOne({ userId }, { $set: { quests: defaults, timezone } });
    profile.quests = defaults;
    profile.timezone = timezone;
  } else if (profile.timezone !== timezone) {
    await profiles.updateOne({ userId }, { $set: { timezone } });
    profile.timezone = timezone;
  }
  const today = dateKey(new Date(), timezone);
  const requestedDay = new URL(request.url).searchParams.get("date") || today;
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(requestedDay) && requestedDay <= today ? requestedDay : today;
  return NextResponse.json({ name: session.user.name || "Adventurer", xp: profile.xp || 0, quests: profile.quests || defaults, completions: profile.days?.[selectedDay] || {}, today, selectedDay });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !ObjectId.isValid(session.user.id)) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const userId = new ObjectId(session.user.id);
  const profiles = db.collection<Profile>("profiles");
  const profile = await profiles.findOne({ userId });
  if (!profile) return NextResponse.json({ error: "Profile unavailable." }, { status: 404 });
  const quests = Array.isArray(profile.quests) ? profile.quests : defaults;
  const days = profile.days || {};
  const timezone = typeof profile.timezone === "string" ? profile.timezone : "UTC";
  const today = dateKey(new Date(), timezone);
  const day = typeof body.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.day) && body.day <= today ? body.day : today;
  if (body.action === "add") {
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 90) : "";
    if (!title) return NextResponse.json({ error: "Add a quest name." }, { status: 400 });
    const quest = { id: new ObjectId().toString(), title, side: Boolean(body.side), xp: body.side ? 25 : 50 };
    await profiles.updateOne({ userId }, { $push: { quests: quest } } as never);
  } else if (body.action === "delete") {
    if (typeof body.id !== "string") return NextResponse.json({ error: "Quest not found." }, { status: 404 });
    await profiles.updateOne({ userId }, { $pull: { quests: { id: body.id } } } as never);
  } else if (body.action === "toggle") {
    const quest = quests.find((item: {id:string}) => item.id === body.id);
    if (!quest) return NextResponse.json({ error: "Quest not found." }, { status: 404 });
    days[day] ||= {};
    const wasDone = Boolean(days[day][quest.id]);
    days[day][quest.id] = !wasDone;
    await profiles.updateOne({ userId }, { $set: { days, xp: Math.max(0, (profile.xp || 0) + (wasDone ? -quest.xp : quest.xp)) } });
  } else return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const updated = await profiles.findOne({ userId });
  return NextResponse.json({ ok: true, xp: updated?.xp || 0, quests: updated?.quests || defaults, completions: updated?.days?.[day] || {}, today, selectedDay: day });
}

