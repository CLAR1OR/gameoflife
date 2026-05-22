"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  disconnectTodoist,
  saveTodoistToken,
} from "@/modules/integrations/todoist/actions";
import { toast } from "sonner";
import type { IntegrationStatus } from "@/modules/integrations/types";

export function IntegrationsSection({
  statuses,
}: {
  statuses: IntegrationStatus[];
}) {
  const router = useRouter();
  const todoist = statuses.find((s) => s.provider === "todoist");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [showInput, setShowInput] = useState(!todoist?.connected);

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

      <div className="p-5 opacity-60">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <div>
            <div className="font-medium text-sm">Google Calendar</div>
            <div className="text-xs text-muted-foreground">
              Coming soon — needs OAuth setup
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
