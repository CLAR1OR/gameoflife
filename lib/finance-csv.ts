import crypto from "node:crypto";
import { BANK_PRESETS, type BankPreset } from "./finance-banks";

export { BANK_PRESETS, listBankOptions, type BankPreset } from "./finance-banks";

export type ParsedCsvRow = {
  occurredOn: string; // YYYY-MM-DD
  amount: number; // signed rounded integer (negative = expense)
  description: string;
  category: string;
  note: string | null;
  importHash: string;
  raw: Record<string, string>;
};

export type ParseResult = {
  rows: ParsedCsvRow[];
  errors: { line: number; reason: string; raw: string }[];
  detectedFormat: string;
  delimiter: string;
  headerRow: string[];
};

// =====================
// LOW-LEVEL PARSER
// =====================

function parseLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        out.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  out.push(current);
  return out.map((c) => c.trim());
}

function detectDelimiter(sample: string): string {
  const semis = (sample.match(/;/g) ?? []).length;
  const commas = (sample.match(/,/g) ?? []).length;
  return semis >= commas ? ";" : ",";
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

// =====================
// FIELD NORMALIZATION
// =====================

const DATE_PATTERNS: RegExp[] = [
  /^(\d{4})-(\d{2})-(\d{2})$/,
  /^(\d{2})\.(\d{2})\.(\d{4})$/,
  /^(\d{2})\/(\d{2})\/(\d{4})$/,
  /^(\d{2})\.(\d{2})\.(\d{2})$/,
  /^(\d{4})\/(\d{2})\/(\d{2})$/,
];

export function parseDate(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  for (const p of DATE_PATTERNS) {
    const m = s.match(p);
    if (!m) continue;
    if (p === DATE_PATTERNS[0]) return `${m[1]}-${m[2]}-${m[3]}`;
    if (p === DATE_PATTERNS[1] || p === DATE_PATTERNS[2]) return `${m[3]}-${m[2]}-${m[1]}`;
    if (p === DATE_PATTERNS[3]) {
      const yy = parseInt(m[3], 10);
      const year = yy < 70 ? 2000 + yy : 1900 + yy;
      return `${year}-${m[2]}-${m[1]}`;
    }
    if (p === DATE_PATTERNS[4]) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  return null;
}

/**
 * Parse a CSV amount cell → integer CENTS (signed).
 *
 *   "-134,64"   → -13464
 *   "1.234,56"  → 123456
 *   "1,234.56"  → 123456
 *   "640,00"    → 64000
 *   "640"       → 64000
 */
export function parseAmount(input: string): number | null {
  if (!input) return null;
  let s = input.trim();
  if (!s) return null;
  s = s.replace(/[€$£¥]/g, "").replace(/\s+/g, "");
  let sign = 1;
  if (s.startsWith("-")) {
    sign = -1;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized: string;
  if (lastComma === -1 && lastDot === -1) {
    normalized = s;
  } else if (lastComma > lastDot) {
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = s.replace(/,/g, "");
  }
  const n = parseFloat(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) * sign;
}

// =====================
// COLUMN RESOLUTION
// =====================

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/^"+|"+$/g, "");
}

type ResolvedColumns = {
  dateIdx: number;
  amountIdx: number;
  descriptionIdxs: number[];
  counterpartyIdx: number | null;
  fallbackCategoryIdx: number | null;
  preset: BankPreset;
};

function findFirstIdx(headers: string[], candidates: string[]): number {
  const norm = headers.map(normalizeHeader);
  for (const c of candidates) {
    const needle = normalizeHeader(c);
    const idx = norm.indexOf(needle);
    if (idx !== -1) return idx;
  }
  return -1;
}

function findAllIdxs(headers: string[], candidates: string[]): number[] {
  const norm = headers.map(normalizeHeader);
  const wanted = new Set(candidates.map(normalizeHeader));
  const out: number[] = [];
  // Preserve the order declared in `candidates` (so Verwendungszweck comes before Buchungstext)
  for (const c of candidates) {
    const idx = norm.indexOf(normalizeHeader(c));
    if (idx !== -1 && !out.includes(idx)) out.push(idx);
  }
  // Defensive: also include any other header matches we missed
  for (let i = 0; i < norm.length; i++) {
    if (wanted.has(norm[i]) && !out.includes(i)) out.push(i);
  }
  return out;
}

function matchPresetSignatures(preset: BankPreset, headers: string[]): boolean {
  if (preset.signatures.length === 0) return false;
  const norm = new Set(headers.map(normalizeHeader));
  return preset.signatures.every((s) => norm.has(normalizeHeader(s)));
}

function resolveColumns(
  headers: string[],
  preset: BankPreset
): ResolvedColumns | null {
  const dateIdx = findFirstIdx(headers, preset.dateHeaders);
  const amountIdx = findFirstIdx(headers, preset.amountHeaders);
  if (dateIdx === -1 || amountIdx === -1) return null;
  const descriptionIdxs = findAllIdxs(headers, preset.descriptionHeaders);
  const cpIdx = findFirstIdx(headers, preset.counterpartyHeaders);
  const fbIdx = findFirstIdx(headers, preset.fallbackCategoryHeaders);
  return {
    dateIdx,
    amountIdx,
    descriptionIdxs,
    counterpartyIdx: cpIdx === -1 ? null : cpIdx,
    fallbackCategoryIdx: fbIdx === -1 ? null : fbIdx,
    preset,
  };
}

function pickPreset(
  bankKey: string,
  headers: string[]
): ResolvedColumns | null {
  if (bankKey !== "auto") {
    const preset = BANK_PRESETS.find((p) => p.key === bankKey);
    if (!preset) return null;
    return resolveColumns(headers, preset);
  }
  // Auto: try signature match first
  for (const preset of BANK_PRESETS) {
    if (matchPresetSignatures(preset, headers)) {
      const resolved = resolveColumns(headers, preset);
      if (resolved) return resolved;
    }
  }
  // Fallback: try each preset's resolver anyway — first one where both date+amount exist wins
  for (const preset of BANK_PRESETS) {
    const resolved = resolveColumns(headers, preset);
    if (resolved) return resolved;
  }
  return null;
}

function hashRow(parts: {
  occurredOn: string;
  amount: number;
  description: string;
}): string {
  const h = crypto.createHash("sha256");
  h.update(parts.occurredOn);
  h.update("|");
  h.update(String(parts.amount));
  h.update("|");
  h.update(parts.description.slice(0, 200).toLowerCase());
  return h.digest("hex").slice(0, 32);
}

// =====================
// PUBLIC API
// =====================

export function parseCsv(text: string, bankKey: string = "auto"): ParseResult {
  const clean = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawLines = clean.split("\n");
  // Skip leading blank lines and known preamble lines from German banks
  let startLine = 0;
  while (
    startLine < rawLines.length &&
    (rawLines[startLine].trim() === "" ||
      /^"?(Umsatzanzeige|Kontostand|Zeitraum|Kontonummer|Konto-Nr|IBAN|BIC)/i.test(
        rawLines[startLine]
      ))
  ) {
    startLine++;
  }
  const lines = rawLines.slice(startLine);
  if (lines.length === 0) {
    return {
      rows: [],
      errors: [{ line: 0, reason: "Empty file", raw: "" }],
      detectedFormat: "unknown",
      delimiter: ";",
      headerRow: [],
    };
  }

  const delimiter = detectDelimiter(lines.slice(0, 5).join("\n"));
  const headerRow = parseLine(lines[0], delimiter);
  const cols = pickPreset(bankKey, headerRow);
  if (!cols) {
    return {
      rows: [],
      errors: [
        {
          line: 1,
          reason:
            bankKey === "auto"
              ? `No known format matched these headers: ${headerRow.join(" | ")}`
              : `Bank "${bankKey}" could not find the expected date/amount columns in headers: ${headerRow.join(" | ")}`,
          raw: lines[0],
        },
      ],
      detectedFormat: bankKey === "auto" ? "unknown" : bankKey,
      delimiter,
      headerRow,
    };
  }

  const rows: ParsedCsvRow[] = [];
  const errors: ParseResult["errors"] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const parts = parseLine(line, delimiter);
    if (parts.length < headerRow.length - 1) continue;
    const dateRaw = parts[cols.dateIdx] ?? "";
    const amountRaw = parts[cols.amountIdx] ?? "";
    const occurredOn = parseDate(dateRaw);
    const amount = parseAmount(amountRaw);
    if (!occurredOn) {
      errors.push({ line: i + 1, reason: `Bad date "${dateRaw}"`, raw: line });
      continue;
    }
    if (amount === null) {
      errors.push({
        line: i + 1,
        reason: `Bad amount "${amountRaw}"`,
        raw: line,
      });
      continue;
    }
    const descParts = cols.descriptionIdxs
      .map((idx) => parts[idx] ?? "")
      .filter(Boolean);
    const counterparty =
      cols.counterpartyIdx !== null ? (parts[cols.counterpartyIdx] ?? "").trim() : "";
    const fallbackCategory =
      cols.fallbackCategoryIdx !== null
        ? (parts[cols.fallbackCategoryIdx] ?? "").trim()
        : "";

    // Description (for the note field): counterparty + all description columns joined
    const descriptionPieces = [counterparty, ...descParts]
      .map((s) => s.trim())
      .filter(Boolean);
    const description = descriptionPieces.join(" · ").slice(0, 500);

    // Category: prefer counterparty > fallback (e.g. Buchungstext) > first description field
    const categoryPick =
      counterparty || fallbackCategory || descParts[0] || "Uncategorized";
    const category = categoryPick.slice(0, 60).trim() || "Uncategorized";

    // Note is the non-category part of the description, if meaningful
    const note = description.length > category.length ? description : null;

    const raw: Record<string, string> = {};
    for (let j = 0; j < headerRow.length; j++) {
      raw[headerRow[j]] = parts[j] ?? "";
    }

    rows.push({
      occurredOn,
      amount,
      description,
      category,
      note,
      importHash: hashRow({ occurredOn, amount, description }),
      raw,
    });
  }

  return {
    rows,
    errors,
    detectedFormat: cols.preset.key,
    delimiter,
    headerRow,
  };
}
