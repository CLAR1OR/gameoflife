import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import { getTripsByUser } from "@/modules/places/queries";
import { TripsView } from "./trips-view";

export default async function TripsPage() {
  const session = await requireSession();
  const trips = await getTripsByUser(session.user.id);
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/places"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to places
        </Link>
      </div>
      <TripsView trips={trips} />
    </div>
  );
}
