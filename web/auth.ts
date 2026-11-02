import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db, mongo } from "@/lib/mongodb";

const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) });
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(mongo),
  session: { strategy: "jwt" },
  providers: [
    Google,
    Discord,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.trim().toLowerCase();
        const user = await db.collection<{ _id: string; name?: string; email: string; passwordHash?: string }>("users").findOne({ email });
        if (!user?.passwordHash || !(await compare(parsed.data.password, user.passwordHash))) return null;
        return { id: String(user._id), name: user.name || "Adventurer", email: user.email };
      },
    }),
  ],
  callbacks: { async session({ session, token }) { if (session.user && token.sub) session.user.id = token.sub; return session; } },
  pages: { signIn: "/" },
});

