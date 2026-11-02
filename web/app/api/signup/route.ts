import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/mongodb";

const schema = z.object({ name: z.string().trim().min(1).max(70), email: z.string().trim().email().max(254), password: z.string().min(12).max(128).regex(/[a-z]/, "Include a lowercase letter.").regex(/[A-Z]/, "Include an uppercase letter.").regex(/[0-9]/, "Include a number.").regex(/[^A-Za-z0-9]/, "Include a symbol.") });
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check your details." }, { status: 400 });
  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();
  try {
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    const passwordHash = await hash(parsed.data.password, 12);
    const result = await db.collection("users").insertOne({ name, email, passwordHash, emailVerified: null, createdAt: new Date() });
    await db.collection("profiles").insertOne({ userId: result.insertedId, xp: 0, rank: "Wayfinder I", quests: [], days: {}, timezone: "" });
    return NextResponse.json({ created: true }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    console.error("Signup unavailable", error);
    return NextResponse.json({ error: "Account creation is unavailable right now." }, { status: 503 });
  }
}

