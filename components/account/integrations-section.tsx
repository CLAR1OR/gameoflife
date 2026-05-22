"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  disconnectTodoist,
  saveTodoistToken,
} from "@/modules/integrations/todoist/actions";
import { disconnectGoogleCalendar } from "@/modules/integrations/google-calendar/actions";
import { toast } from "sonner";
import type { IntegrationStatus } from "@/modules/integrations/types";

export function IntegrationsSection({
  statuses,
}: {
  statuses: IntegrationStatus[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const todoist = statuses.find((s) => s.provider === "todoist");
  const gcal = statuses.find((s) => s.provider === "google_calendar");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [gcalBusy, setGcalBusy] = useState(false);
  const [showInput, setShowInput] = useState(!todoist?.connected);

  // Surface ?gcal=ok|error from the OAuth callback redirect.
  useEffect(() => {
    const status = searchParams.get("gcal");
    if (!status) return;
    if (status === "ok") {
      toast.success("Google Calendar connected");
    } else {
      const msg = searchParams.get("gcal_msg") ?? "Authorization failed";
      toast.error(`Google Calendar: ${msg}`);
    }
    // Strip the query params so a refresh doesn't re-toast.
    router.replace("/account#integrations");
  }, [searchParams, router]);

  async function handleDisconnectGcal() {
    if (!confirm("Disconnect Google Calendar?")) return;
    setGcalBusy(true);
    try {
      await disconnectGoogleCalendar();
      toast.success("Disconnected");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setGcalBusy(false);
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setBusy(true);
    try {
      await saveTodoistToken(token);
      toast.success("Todoist connected");
      setToken("");
      setShowInput(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Todoist?")) return;
    setBusy(true);
    try {
      await disconnectTodoist();
      toast.success("Disconnected");
      setShowInput(true);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="rounded-xl border bg-card divide-y divide-border/60">
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <div>
              <div className="font-medium text-sm">Todoist</div>
              <div className="text-xs text-muted-foreground">
                Show today&apos;s tasks in the side panel · press{" "}
                <kbd className="px-1 py-0.5 rounded bg-muted/60 border border-border/40 text-[10px]">
                  q
                </kbd>{" "}
                to open
              </div>
            </div>
          </div>
          {todoist?.connected ? (
            <Badge
              variant="outline"
              className="text-glow border-glow/40 font-mono text-[10px]"
            >
              connected
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-muted-foreground font-mono text-[10px]"
            >
              not connected
            </Badge>
          )}
        </div>

        {showInput ? (
          <form onSubmit={handleConnect} className="space-y-2">
            <Label className="text-[10px]">Personal API token</Label>
            <Input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="0123456789abcdef…"
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Get this from{" "}
              <a
                href="https://app.todoist.com/app/settings/integrations/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-glow hover:underline"
              >
                Todoist → Settings → Integrations → Developer
              </a>
              . Stored on this server only — never sent to your browser.
            </p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy || !token.trim()}>
                {busy ? "Connecting…" : "Connect"}
              </Button>
              {todoist?.connected && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setToken("");
                    setShowInput(false);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowInput(true)}
              disabled={busy}
            >
              Replace token
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDisconnect}
              disabled={busy}
              className="text-destructive"
            >
              Disconnect
            </Button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <div>
              <div className="font-medium text-sm">Google Calendar</div>
              <div className="text-xs text-muted-foreground">
                Show this week in a modal · press{" "}
                <kbd className="px-1 py-0.5 rounded bg-muted/60 border border-border/40 text-[10px]">
                  w
                </kbd>{" "}
                to open
              </div>
            </div>
          </div>
          {gcal?.connected ? (
            <Badge
              variant="outline"
              className="text-glow border-glow/40 font-mono text-[10px]"
            >
              connected
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-muted-foreground font-mono text-[10px]"
            >
              not connected
            </Badge>
          )}
        </div>

        {gcal?.connected ? (
          <div className="flex gap-2">
            <a
              href="/api/integrations/google-calendar/connect"
              className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 hover:bg-accent transition-colors text-muted-foreground"
            >
              Reauthorize
            </a>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDisconnectGcal}
              disabled={gcalBusy}
              className="text-destructive"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              You&apos;ll be sent to Google to grant calendar access
              (read + write). Tokens are stored on this server only and
              refreshed automatically.
            </p>
            <a
              href="/api/integrations/google-calendar/connect"
              className="inline-flex items-center justify-center rounded-md text-xs font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Connect Google Calendar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
