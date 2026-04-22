# CSV Samples

Drop bank CSV exports here for parser tuning.

## Usage

1. Export transactions from your bank as CSV.
2. Save the file as `samples/bank-sample.csv` (or any name — just tell Claude which one to look at).
3. Ask Claude to adapt `lib/finance-csv.ts` to your specific bank's format.

## Currently supported (auto-detected)

The parser in `lib/finance-csv.ts` detects columns by header name. These German and English column names work out of the box:

- **Date**: `Buchungstag`, `Buchungsdatum`, `Valutadatum`, `Valuta`, `Datum`, `Date`, `Posting Date`, `Booking Date`, `Transaction Date`
- **Amount**: `Betrag`, `Umsatz`, `Amount`, `Value`, `Betrag (€)`, `Betrag (EUR)`
- **Description**: `Verwendungszweck`, `Buchungstext`, `Description`, `Memo`, `Subject`, `Text`, `Zweck`
- **Counterparty**: `Beguenstigter/Zahlungspflichtiger`, `Auftraggeber/Empfänger`, `Zahlungsempfänger`, `Payee`, `Counterparty`, `Name`

Date formats supported: `YYYY-MM-DD`, `DD.MM.YYYY`, `DD/MM/YYYY`, `DD.MM.YY`, `YYYY/MM/DD`.
Amount formats supported: European (`1.234,56`) and US (`1,234.56`), with optional `+`/`-`/`€` symbols.

## Deduplication

Each imported transaction is hashed by `date + amount + description`. Re-importing the same CSV inserts zero new rows. A unique partial index enforces this at the DB level.

## Folder is gitignored by default

Consider adding `/samples/` to `.gitignore` if your CSVs contain sensitive info.
