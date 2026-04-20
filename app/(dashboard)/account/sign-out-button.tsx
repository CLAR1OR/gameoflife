"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={loading}
      className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
