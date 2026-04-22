/**
 * Parser for a Goodreads library export CSV.
 *
 * The Goodreads export has these columns (in order):
 *   Book Id, Title, Author, Author l-f, Additional Authors,
 *   ISBN, ISBN13, My Rating, Average Rating, Publisher, Binding,
 *   Number of Pages, Year Published, Original Publication Year,
 *   Date Read, Date Added, Bookshelves, Bookshelves with positions,
 *   Exclusive Shelf, My Review, Spoiler, Private Notes, Read Count,
 *   Owned Copies
 */

export type GoodreadsRow = {
  title: string;
  authors: string;
  isbn: string | null;
  rating: number | null;
  dateRead: Date | null;
  dateAdded: Date | null;
  status: "want" | "reading" | "read";
  pages: number | null;
  year: number | null;
  review: string | null;
};

function stripGoodreadsValue(v: string): string {
  // Goodreads wraps ISBNs as ="9780679734505" — strip the leading =
  let t = v.trim();
  if (t.startsWith('="') && t.endsWith('"')) t = t.slice(2, -1);
  return t;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      // swallow \r\n
      if (ch === "\r" && text[i + 1] === "\n") i += 2;
      else i++;
      continue;
    }
    cell += ch;
    i++;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 0 && r.some((c) => c.length > 0));
}

function parseDate(s: string): Date | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  // Goodreads format: YYYY/MM/DD or YYYY-MM-DD
  const t = trimmed.replace(/\//g, "-");
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
}

export function parseGoodreadsCsv(text: string): GoodreadsRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((c) => c.trim());
  const idx = (name: string) => header.indexOf(name);

  const iTitle = idx("Title");
  const iAuthor = idx("Author");
  const iAddAuthors = idx("Additional Authors");
  const iIsbn = idx("ISBN");
  const iIsbn13 = idx("ISBN13");
  const iRating = idx("My Rating");
  const iDateRead = idx("Date Read");
  const iDateAdded = idx("Date Added");
  const iShelf = idx("Exclusive Shelf");
  const iPages = idx("Number of Pages");
  const iYear = idx("Original Publication Year");
  const iYear2 = idx("Year Published");
  const iReview = idx("My Review");

  const out: GoodreadsRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const title = (row[iTitle] ?? "").trim();
    if (!title) continue;

    const shelf = (row[iShelf] ?? "").trim();
    let status: "want" | "reading" | "read" = "want";
    if (shelf === "read") status = "read";
    else if (shelf === "currently-reading") status = "reading";

    const authorBase = (row[iAuthor] ?? "").trim();
    const extra = iAddAuthors >= 0 ? stripGoodreadsValue(row[iAddAuthors] ?? "").trim() : "";
    const authors = [authorBase, extra].filter(Boolean).join(", ");

    const isbnVal =
      (iIsbn13 >= 0 ? stripGoodreadsValue(row[iIsbn13] ?? "") : "") ||
      (iIsbn >= 0 ? stripGoodreadsValue(row[iIsbn] ?? "") : "");
    const isbn = isbnVal.length > 0 ? isbnVal : null;

    const ratingRaw = parseInt(row[iRating] ?? "", 10);
    const rating =
      Number.isFinite(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5
        ? ratingRaw
        : null;

    const pagesRaw = parseInt(row[iPages] ?? "", 10);
    const pages = Number.isFinite(pagesRaw) && pagesRaw > 0 ? pagesRaw : null;

    const yearRaw = parseInt(row[iYear] ?? "", 10);
    const yearFallback = parseInt(row[iYear2] ?? "", 10);
    const year = Number.isFinite(yearRaw)
      ? yearRaw
      : Number.isFinite(yearFallback)
        ? yearFallback
        : null;

    out.push({
      title,
      authors: authors || "Unknown",
      isbn,
      rating,
      dateRead: iDateRead >= 0 ? parseDate(row[iDateRead] ?? "") : null,
      dateAdded: iDateAdded >= 0 ? parseDate(row[iDateAdded] ?? "") : null,
      status,
      pages,
      year,
      review: iReview >= 0 && (row[iReview] ?? "").trim() ? row[iReview].trim() : null,
    });
  }
  return out;
}

/** Build an Open Library cover URL for an ISBN. Safe to use as <img src>. */
export function openLibraryCoverUrl(isbn: string | null | undefined, size: "S" | "M" | "L" = "M"): string | null {
  if (!isbn) return null;
  const clean = isbn.replace(/[-\s]/g, "");
  if (!/^\d{10,13}$/.test(clean)) return null;
  return `https://covers.openlibrary.org/b/isbn/${clean}-${size}.jpg`;
}
