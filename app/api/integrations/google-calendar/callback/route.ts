import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSession } from "@/lib/auth-server";
import { exchangeAndStoreCode } from "@/modules/integrations/google-calendar/actions";

const STATE_COOKIE = "gcal_oauth_state";

function back(status: "ok" | "error", message?: string) {
  const url = new URL("/account", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000");
  url.hash = "integrations";
  url.searchParams.set("gcal", status);
  if (message) url.searchParams.set("gcal_msg", message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);

  const error = searchParams.get("error");
  if (error) return back("error", error);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) return back("error", "missing_code");

  const cookieStore = await cookies();
  const expected = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  if (!expected || expected !== state) return back("error", "state_mismatch");

  try {
    await exchangeAndStoreCode(session.user.id, code);
  } catch (e) {
    return back("error", e instanceof Error ? e.message : "exchange_failed");
  }
  return back("ok");
}
