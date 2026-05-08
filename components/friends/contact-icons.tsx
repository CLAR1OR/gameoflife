import type { FriendContact } from "@/modules/friends/queries";

const KIND_META: Record<
  FriendContact["kind"],
  { icon: string; label: string; href?: (v: string) => string }
> = {
  phone: { icon: "📞", label: "Phone", href: (v) => `tel:${v}` },
  whatsapp: {
    icon: "🟢",
    label: "WhatsApp",
    href: (v) => `https://wa.me/${v.replace(/\D/g, "")}`,
  },
  telegram: {
    icon: "✈️",
    label: "Telegram",
    href: (v) =>
      v.startsWith("@") ? `https://t.me/${v.slice(1)}` : `https://t.me/${v}`,
  },
  signal: { icon: "🔒", label: "Signal" },
  email: { icon: "✉️", label: "Email", href: (v) => `mailto:${v}` },
  instagram: {
    icon: "📸",
    label: "Instagram",
    href: (v) =>
      `https://instagram.com/${v.replace(/^@/, "").replace(/\/$/, "")}`,
  },
  linkedin: {
    icon: "💼",
    label: "LinkedIn",
    href: (v) => (v.startsWith("http") ? v : `https://linkedin.com/in/${v}`),
  },
  twitter: {
    icon: "🐦",
    label: "Twitter / X",
    href: (v) => `https://twitter.com/${v.replace(/^@/, "")}`,
  },
  facebook: { icon: "👥", label: "Facebook" },
  discord: { icon: "🎮", label: "Discord" },
  snapchat: { icon: "👻", label: "Snapchat" },
  address: { icon: "🏠", label: "Address" },
  other: { icon: "🔗", label: "Other" },
};

export function contactKindMeta(kind: FriendContact["kind"]) {
  return KIND_META[kind] ?? KIND_META.other;
}

export function ContactPill({ contact }: { contact: FriendContact }) {
  const meta = contactKindMeta(contact.kind);
  const href = meta.href ? meta.href(contact.value) : null;
  const inner = (
    <>
      <span>{meta.icon}</span>
      <span className="font-mono truncate">{contact.value}</span>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        title={meta.label}
        className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] hover:border-glow/40 transition-colors max-w-full"
      >
        {inner}
      </a>
    );
  }
  return (
    <span
      title={meta.label}
      className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] max-w-full"
    >
      {inner}
    </span>
  );
}
