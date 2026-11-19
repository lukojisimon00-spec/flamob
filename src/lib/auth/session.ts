/**
 * Session côté serveur Next.js.
 * Cookie httpOnly + SameSite=Lax (+ Secure en production) contenant un jeton aléatoire de 256 bits ;
 * seul son SHA-256 est stocké côté serveur.
 */
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Agent, User, UserRole } from "../db/schema";
import { readDb, transact } from "../db/store";
import { createSession, destroySession, findSessionUser, SESSION_DAYS } from "../domain/users";
import { can, type Permission } from "./permissions";

export const SESSION_COOKIE = "flamob_session";

export async function startSession(userId: string) {
  const ua = (await headers()).get("user-agent") ?? undefined;
  const { token } = transact((db) => createSession(db, userId, new Date(), ua));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) transact((db) => destroySession(db, token));
  jar.delete(SESSION_COOKIE);
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await sessionToken();
  if (!token) return null;
  return findSessionUser(readDb(), token, new Date());
}

export const homeFor = (role: UserRole) => (role === "admin" ? "/admin" : role === "agent" ? "/agent" : "/app");

export async function requireRole(role: UserRole): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}

export async function requireClient(): Promise<User> {
  const user = await requireRole("client");
  if (!user.phoneVerifiedSimulated) redirect("/verification");
  return user;
}

export async function requireAgent(): Promise<{ user: User; agent: Agent }> {
  const user = await requireRole("agent");
  const agent = readDb().agents.find((a) => a.userId === user.id);
  if (!agent) redirect("/connexion?erreur=agent");
  return { user, agent };
}

export async function requirePermission(permission: Permission): Promise<User> {
  const user = await requireRole("admin");
  if (!can(user, permission)) redirect("/admin?refus=1");
  return user;
}
