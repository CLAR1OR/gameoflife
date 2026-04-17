import { TopNav } from "@/components/layout/top-nav";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-6">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
