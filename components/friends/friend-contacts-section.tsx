"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addContact,
  updateContact,
  deleteContact,
} from "@/modules/friends/actions";
import { toast } from "sonner";
import { ContactPill, contactKindMeta } from "./contact-icons";
import type { FriendContact } from "@/modules/friends/queries";

const KINDS: { value: FriendContact["kind"]; label: string }[] = [
  { value: "phone", label: "📞 Phone" },
  { value: "whatsapp", label: "🟢 WhatsApp" },
  { value: "telegram", label: "✈️ Telegram" },
  { value: "signal", label: "🔒 Signal" },
  { value: "email", label: "✉️ Email" },
  { value: "instagram", label: "📸 Instagram" },
  { value: "linkedin", label: "💼 LinkedIn" },
  { value: "twitter", label: "🐦 Twitter / X" },
  { value: "facebook", label: "👥 Facebook" },
  { value: "discord", label: "🎮 Discord" },
  { value: "snapchat", label: "👻 Snapchat" },
  { value: "address", label: "🏠 Address" },
  { value: "other", label: "🔗 Other" },
];

export function FriendContactsSection({
  friendId,
  contacts,
  /** Legacy phone/email on the friend row — show as deprecated suggestions
   * to migrate. */
  legacyPhone,
  legacyEmail,
}: {
  friendId: string;
  contacts: FriendContact[];
  legacyPhone: string | null;
  legacyEmail: string | null;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<FriendContact["kind"]>("phone");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    try {
      await addContact({ friendId, kind, value });
      setValue("");
      setAdding(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact entry?")) return;
    try {
      await deleteContact(id);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
          📇 Contact methods
        </h2>
        <button
          type="button"
          onClick={() => setAdding((s) => !s)}
          className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
        >
          {adding ? "cancel" : "+ add"}
        </button>
      </div>

      {contacts.length === 0 && !legacyPhone && !legacyEmail && !adding && (
        <p className="text-xs text-muted-foreground/70 italic">
          No contacts yet. Add a phone, WhatsApp, email, social handle…
        </p>
      )}

      {contacts.length > 0 && (
        <ul className="space-y-1.5">
          {contacts.map((c) =>
            editingId === c.id ? (
              <EditContactRow
                key={c.id}
                contact={c}
                onDone={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            ) : (
              <li
                key={c.id}
                className="flex items-center gap-2 group"
              >
                <ContactPill contact={c} />
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  {contactKindMeta(c.kind).label}
                </span>
                <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setEditingId(c.id)}
                    className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
                  >
                    edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-[10px] font-mono text-muted-foreground/40 hover:text-destructive"
                  >
                    ✕
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {(legacyPhone || legacyEmail) && (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-2 text-[11px] text-muted-foreground space-y-1">
          <div>
            Legacy contact fields on the friend record:
            {legacyPhone && (
              <span className="ml-2 font-mono">📞 {legacyPhone}</span>
            )}
            {legacyEmail && (
              <span className="ml-2 font-mono">✉️ {legacyEmail}</span>
            )}
          </div>
          <div className="text-[10px]">
            Add them as proper contacts above to unlock click-to-call /
            link-out and to keep things tidy.
          </div>
        </div>
      )}

      {adding && (
        <form
          onSubmit={handleAdd}
          className="rounded-md border border-glow/30 bg-glow/5 p-3 space-y-2"
        >
          <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-end">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as FriendContact["kind"])}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value (e.g. +49…, @handle, email@…)"
              className="h-8 text-xs"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              disabled={busy || !value.trim()}
              className="h-8 text-xs"
            >
              Add
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function EditContactRow({
  contact,
  onDone,
}: {
  contact: FriendContact;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<FriendContact["kind"]>(contact.kind);
  const [value, setValue] = useState(contact.value);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateContact(contact.id, { kind, value });
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <li className="flex items-center gap-1 flex-wrap">
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as FriendContact["kind"])}
        className="h-7 rounded-md border border-input bg-background px-2 text-xs"
      >
        {KINDS.map((k) => (
          <option key={k.value} value={k.value}>
            {k.label}
          </option>
        ))}
      </select>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-7 text-xs flex-1 min-w-[120px]"
      />
      <Button size="sm" onClick={save} disabled={busy} className="h-7 text-xs">
        Save
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDone}
        className="h-7 text-xs"
      >
        Cancel
      </Button>
    </li>
  );
}
