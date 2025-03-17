import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        token: { label: "Token", type: "text" }, // Ajout pour OAuth
      },
      async authorize(credentials) {
        try {
          if (credentials?.token) {
            // Cas OAuth : token reçu depuis le backend
            return { id: "", token: credentials.token, role: "USER" }; // Rôle temporaire, ajustable
          }
          // Cas login classique
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/login`,
            {
              email: credentials?.email,
              password: credentials?.password,
            }
          );
          const user = res.data;
          if (user && user.token) {
            return { id: user.user_id, token: user.token, role: user.role };
          }
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.token = user.token;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.token = token.token as string;
      session.user.role = token.role as "ADMIN" | "USER";
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
