import { requireSession } from "@/lib/auth-server";
import {
  getHikesByUser,
  getHikeStats,
  getTripsByUser,
} from "@/modules/places/queries";
import { HikesView } from "./hikes-view";

export default async function HikesPage() {
  const session = await requireSession();
  const [hikes, stats, trips] = await Promise.all([
    getHikesByUser(session.user.id),
    getHikeStats(session.user.id),
    getTripsByUser(session.user.id),
  ]);

  return <HikesView hikes={hikes} stats={stats} trips={trips} />;
}
