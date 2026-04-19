import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Require a valid session for a server component or action.
 *
 * If the cookie is missing or points at a session that no longer exists
 * in the DB (e.g. after a dev DB reset), this redirects to /login instead
 * of throwing — giving the user a clean way back in.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
