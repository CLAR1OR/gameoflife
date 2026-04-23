import { requireSession } from "@/lib/auth-server";
import {
  getBooksByUser,
  getBookStats,
  getBooksReadThisYear,
  getBooksPerMonth,
  getBooksPerYear,
  getRatingDistribution,
  getRecentlyFinished,
} from "@/modules/books/queries";
import { getUserSettings } from "@/modules/settings/queries";
import { BooksView } from "./books-view";

export default async function BooksPage() {
  const session = await requireSession();
  const [
    books,
    stats,
    yearTotal,
    months,
    years,
    ratings,
    recent,
    settings,
  ] = await Promise.all([
    getBooksByUser(session.user.id),
    getBookStats(session.user.id),
    getBooksReadThisYear(session.user.id),
    getBooksPerMonth(session.user.id, 12),
    getBooksPerYear(session.user.id),
    getRatingDistribution(session.user.id),
    getRecentlyFinished(session.user.id, 20),
    getUserSettings(session.user.id),
  ]);

  return (
    <BooksView
      books={books}
      stats={stats}
      yearTotal={yearTotal}
      yearlyGoal={settings.yearlyBookGoal}
      months={months}
      years={years}
      ratings={ratings}
      recent={recent}
    />
  );
}
