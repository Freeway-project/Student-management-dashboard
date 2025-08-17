import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        await dbConnect();
        const user = await User.findOne({ email: creds?.email });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(creds!.password!, user.passwordHash);
        return ok ? { id: String(user._id), name: user.name, email: user.email } : null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.id) (session.user as any).id = token.id;
      return session;
    },
  },
};
