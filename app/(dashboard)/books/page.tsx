import { requireSession } from "@/lib/auth-server";
import { getBooksByUser, getBookStats } from "@/modules/books/queries";
import { BooksView } from "./books-view";

export default async function BooksPage() {
  const session = await requireSession();
  const [books, stats] = await Promise.all([
    getBooksByUser(session.user.id),
    getBookStats(session.user.id),
  ]);

  return <BooksView books={books} stats={stats} />;
}
