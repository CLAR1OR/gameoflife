import { TopNav } from "@/components/layout/top-nav";
import { BrandMark } from "@/components/layout/brand-mark";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main>
        <div className="mx-auto w-full max-w-5xl px-6 pb-12 pt-2">
          {children}
        </div>
      </main>
      <BrandMark />
      <Toaster />
    </div>
  );
}
