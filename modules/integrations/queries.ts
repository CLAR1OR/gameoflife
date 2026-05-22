import { db } from "@/lib/db";
import { integrationCredential } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { IntegrationCredential, IntegrationProvider, IntegrationStatus } from "./types";

export async function getIntegrationCredential(
  userId: string,
  provider: IntegrationProvider
): Promise<IntegrationCredential | null> {
  const [row] = await db
    .select()
    .from(integrationCredential)
    .where(
      and(
        eq(integrationCredential.userId, userId),
        eq(integrationCredential.provider, provider)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function getIntegrationStatuses(
  userId: string
): Promise<IntegrationStatus[]> {
  const rows = await db
    .select({
      provider: integrationCredential.provider,
      createdAt: integrationCredential.createdAt,
    })
    .from(integrationCredential)
    .where(eq(integrationCredential.userId, userId));

  const connected = new Map(rows.map((r) => [r.provider, r.createdAt]));
  const providers: IntegrationProvider[] = ["todoist", "google_calendar"];
  return providers.map((p) => ({
    provider: p,
    connected: connected.has(p),
    connectedAt: connected.get(p) ?? null,
  }));
}
