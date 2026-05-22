import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSession } from "@/lib/auth-server";
import { buildAuthUrl } from "@/modules/integrations/google-calendar/oauth";

const STATE_COOKIE = "gcal_oauth_state";
const STATE_TTL_S = 60 * 10; // 10 minutes is plenty for the user to consent

export async function GET() {
  await requireSession();
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STATE_TTL_S,
  });

  return NextResponse.redirect(buildAuthUrl(state));
}
