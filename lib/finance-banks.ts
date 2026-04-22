// Client-safe bank-preset catalog.
// The actual CSV parser (which depends on node:crypto) lives in
// `lib/finance-csv.ts`. This file holds only pure data + a tiny helper so it
// can be imported by client components (e.g. the import dialog's bank picker).

export type BankPreset = {
  key: string;
  label: string;
  /** Headers (lowercase) that identify this bank. All must be present for auto-detect to match. */
  signatures: string[];
  dateHeaders: string[];
  amountHeaders: string[];
  descriptionHeaders: string[];
  counterpartyHeaders: string[];
  /** Used as category when counterparty is empty (e.g. bank fees with no payee). */
  fallbackCategoryHeaders: string[];
};

export const BANK_PRESETS: BankPreset[] = [
  {
    key: "volksbank",
    label: "Volksbank / Raiffeisenbank (GENODE…)",
    signatures: ["bezeichnung auftragskonto", "name zahlungsbeteiligter"],
    dateHeaders: ["buchungstag", "valutadatum"],
    amountHeaders: ["betrag"],
    descriptionHeaders: ["verwendungszweck"],
    counterpartyHeaders: ["name zahlungsbeteiligter"],
    fallbackCategoryHeaders: ["buchungstext"],
  },
  {
    key: "sparkasse",
    label: "Sparkasse (CAMT-style)",
    signatures: ["auftragskonto", "beguenstigter/zahlungspflichtiger"],
    dateHeaders: ["buchungstag", "valutadatum"],
    amountHeaders: ["betrag"],
    descriptionHeaders: ["verwendungszweck", "buchungstext"],
    counterpartyHeaders: [
      "beguenstigter/zahlungspflichtiger",
      "begünstigter/zahlungspflichtiger",
    ],
    fallbackCategoryHeaders: ["buchungstext"],
  },
  {
    key: "dkb",
    label: "DKB",
    signatures: ["auftraggeber / begünstigter", "zahlungspflichtige*r"],
    dateHeaders: ["buchungsdatum", "wertstellung", "buchungstag"],
    amountHeaders: ["betrag (€)", "betrag"],
    descriptionHeaders: ["verwendungszweck"],
    counterpartyHeaders: [
      "zahlungspflichtige*r",
      "zahlungsempfänger*in",
      "auftraggeber / begünstigter",
    ],
    fallbackCategoryHeaders: ["umsatztyp", "buchungstext"],
  },
  {
    key: "ing",
    label: "ING",
    signatures: ["buchung", "valuta", "auftraggeber/empfänger"],
    dateHeaders: ["buchung", "valuta", "buchungsdatum"],
    amountHeaders: ["betrag", "umsatz"],
    descriptionHeaders: ["verwendungszweck"],
    counterpartyHeaders: [
      "auftraggeber/empfänger",
      "auftraggeber/empfaenger",
    ],
    fallbackCategoryHeaders: ["buchungstext"],
  },
  {
    key: "generic-en",
    label: "Generic English",
    signatures: ["date", "amount", "description"],
    dateHeaders: ["date", "posting date", "booking date", "transaction date"],
    amountHeaders: ["amount", "value"],
    descriptionHeaders: ["description", "memo", "subject", "text"],
    counterpartyHeaders: ["payee", "counterparty", "name"],
    fallbackCategoryHeaders: ["category", "type"],
  },
];

export function listBankOptions(): { key: string; label: string }[] {
  return [
    { key: "auto", label: "Auto-detect" },
    ...BANK_PRESETS.map((p) => ({ key: p.key, label: p.label })),
  ];
}
