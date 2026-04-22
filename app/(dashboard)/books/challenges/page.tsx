import { requireSession } from "@/lib/auth-server";
import {
  getReadingLists,
  getActivatedReadingListTemplateIds,
} from "@/modules/books/queries";
import { READING_LIST_TEMPLATES } from "@/lib/books-templates";
import { ChallengesView } from "./challenges-view";
import { openLibraryCoverUrl } from "@/lib/books-csv";

export default async function ChallengesPage() {
  const session = await requireSession();
  const [lists, activatedIds] = await Promise.all([
    getReadingLists(session.user.id),
    getActivatedReadingListTemplateIds(session.user.id),
  ]);

  // Precompute sample covers per template for preview tiles
  const templates = READING_LIST_TEMPLATES.map((t) => ({
    ...t,
    sampleCovers: t.books.slice(0, 5).map((b) => openLibraryCoverUrl(b.isbn ?? null, "M")),
    isActivated: activatedIds.has(t.id),
  }));

  return <ChallengesView lists={lists} templates={templates} />;
}
