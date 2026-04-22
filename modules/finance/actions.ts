"use server";

import { db } from "@/lib/db";
import {
  financeTransaction,
  financeAccount,
  financeRecurring,
  financeNetWorthSnapshot,
  userSettings,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { getNetWorth } from "./queries";
import { isAccountStale } from "./shared";
import type { AccountType, TransactionType } from "./queries";
import { parseCsv, type ParsedCsvRow } from "@/lib/finance-csv";
import { checkFinanceAchievements } from "@/lib/finance-achievements";

// =====================
// ACCOUNTS
// =====================

export async function createAccount(data: {
  name: string;
  type: AccountType;
  balance: number;
  icon?: string;
}) {
  const session = await requireSession();
  const name = data.name.trim();
  if (!name) throw new Error("Name is required");

  const now = new Date();
  const [row] = await db
    .insert(financeAccount)
    .values({
      userId: session.user.id,
      name,
      type: data.type,
      balance: Math.round(Number(data.balance) || 0),
      icon: data.icon?.trim() || null,
      lastCheckedAt: now,
    })
    .returning();

  const newAchievements = await checkFinanceAchievements(session.user.id);
  revalidatePath("/finance");
  revalidatePath("/");
  revalidatePath("/achievements");
  return { ...row, newAchievements };
}

export async function updateAccountBalance(accountId: string, balance: number) {
  const session = await requireSession();
  const safe = Math.round(Number(balance) || 0);
  await db
    .update(financeAccount)
    .set({ balance: safe, updatedAt: new Date() })
    .where(
      and(
        eq(financeAccount.id, accountId),
        eq(financeAccount.userId, session.user.id)
      )
    );
  const xpAwarded = await markAccountCheckedIn(
    accountId,
    session.user.id,
    true
  );
  const newAchievements = await checkFinanceAchievements(session.user.id);
  revalidatePath("/finance");
  revalidatePath("/");
  revalidatePath("/achievements");
  return { balance: safe, xpAwarded, newAchievements };
}

export async function declareAccountUnchanged(accountId: string) {
  const session = await requireSession();
  const xpAwarded = await markAccountCheckedIn(
    accountId,
    session.user.id,
    true
  );
  const newAchievements = await checkFinanceAchievements(session.user.id);
  revalidatePath("/finance");
  revalidatePath("/");
  revalidatePath("/achievements");
  return { xpAwarded, newAchievements };
}

export async function renameAccount(accountId: string, name: string) {
  const session = await requireSession();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");
  await db
    .update(financeAccount)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(
      and(
        eq(financeAccount.id, accountId),
        eq(financeAccount.userId, session.user.id)
      )
    );
  revalidatePath("/finance");
}

export async function deleteAccount(accountId: string) {
  const session = await requireSession();
  await db
    .update(financeAccount)
    .set({ archivedAt: new Date() })
    .where(
      and(
        eq(financeAccount.id, accountId),
        eq(financeAccount.userId, session.user.id)
      )
    );
  revalidatePath("/finance");
  revalidatePath("/");
  return { ok: true };
}

// =====================
// CHECK-IN + BALANCE HELPERS
// =====================

/**
 * Mark an account as checked-in right now. If the account was stale
 * (no check-in in the last CHECKIN_STALE_DAYS) and `awardXp` is true,
 * grant 1 general XP to the user.
 *
 * Returns how much XP was awarded (0 or 1).
 */
async function markAccountCheckedIn(
  accountId: string,
  userId: string,
  awardXp: boolean
): Promise<number> {
  const account = await db.query.financeAccount.findFirst({
    where: (a, { and: an, eq: e }) =>
      an(e(a.id, accountId), e(a.userId, userId)),
  });
  if (!account) return 0;
  const wasStale = isAccountStale(account);
  await db
    .update(financeAccount)
    .set({ lastCheckedAt: new Date() })
    .where(
      and(
        eq(financeAccount.id, accountId),
        eq(financeAccount.userId, userId)
      )
    );
  if (!wasStale || !awardXp) return 0;

  const existing = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, userId),
  });
  if (existing) {
    await db
      .update(userSettings)
      .set({
        generalXp: sql`${userSettings.generalXp} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({ userId, generalXp: 1 });
  }
  return 1;
}

async function applyBalanceDelta(
  accountId: string,
  userId: string,
  delta: number
) {
  if (delta === 0) return;
  await db
    .update(financeAccount)
    .set({
      balance: sql`${financeAccount.balance} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(financeAccount.id, accountId),
        eq(financeAccount.userId, userId)
      )
    );
}

type TxEffect = {
  type: TransactionType;
  amount: number;
  accountId: string | null;
  transferToAccountId: string | null;
};

async function applyEffects(tx: TxEffect, userId: string) {
  if (tx.type === "income" && tx.accountId) {
    await applyBalanceDelta(tx.accountId, userId, tx.amount);
  } else if (tx.type === "expense" && tx.accountId) {
    await applyBalanceDelta(tx.accountId, userId, -tx.amount);
  } else if (tx.type === "transfer") {
    if (tx.accountId) await applyBalanceDelta(tx.accountId, userId, -tx.amount);
    if (tx.transferToAccountId)
      await applyBalanceDelta(tx.transferToAccountId, userId, tx.amount);
  }
}

async function reverseEffects(tx: TxEffect, userId: string) {
  await applyEffects(
    { ...tx, amount: -tx.amount },
    userId
  );
}

// =====================
// TRANSACTIONS
// =====================

export async function createTransaction(data: {
  type: TransactionType;
  amount: number;
  category: string;
  note?: string;
  occurredOn: string;
  accountId?: string | null;
  transferToAccountId?: string | null;
}) {
  const session = await requireSession();

  const amount = Math.round(Math.abs(Number(data.amount)));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  const category = data.category.trim();
  if (!category) throw new Error("Category is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.occurredOn)) {
    throw new Error("Date must be YYYY-MM-DD");
  }
  if (!["income", "expense", "transfer"].includes(data.type)) {
    throw new Error("Invalid type");
  }
  if (data.type === "transfer") {
    if (!data.accountId || !data.transferToAccountId) {
      throw new Error("Transfer needs both source and destination accounts");
    }
    if (data.accountId === data.transferToAccountId) {
      throw new Error("Source and destination must differ");
    }
  }

  const [row] = await db
    .insert(financeTransaction)
    .values({
      userId: session.user.id,
      type: data.type,
      amount,
      category,
      note: data.note?.trim() || null,
      occurredOn: data.occurredOn,
      accountId: data.accountId ?? null,
      transferToAccountId:
        data.type === "transfer" ? data.transferToAccountId ?? null : null,
    })
    .returning();

  await applyEffects(
    {
      type: data.type,
      amount,
      accountId: data.accountId ?? null,
      transferToAccountId:
        data.type === "transfer" ? data.transferToAccountId ?? null : null,
    },
    session.user.id
  );

  let xpAwarded = 0;
  const touched = new Set<string>();
  if (data.accountId) touched.add(data.accountId);
  if (data.type === "transfer" && data.transferToAccountId)
    touched.add(data.transferToAccountId);
  for (const id of touched) {
    xpAwarded += await markAccountCheckedIn(id, session.user.id, true);
  }

  const newAchievements = await checkFinanceAchievements(session.user.id);
  revalidatePath("/finance");
  revalidatePath("/");
  revalidatePath("/achievements");
  return { ...row, xpAwarded, newAchievements };
}

export async function updateTransaction(
  id: string,
  data: {
    type: TransactionType;
    amount: number;
    category: string;
    note?: string;
    occurredOn: string;
    accountId?: string | null;
    transferToAccountId?: string | null;
  }
) {
  const session = await requireSession();
  const existing = await db.query.financeTransaction.findFirst({
    where: (t, { and: a, eq: e }) =>
      a(e(t.id, id), e(t.userId, session.user.id)),
  });
  if (!existing) throw new Error("Transaction not found");

  const amount = Math.round(Math.abs(Number(data.amount)));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  const category = data.category.trim();
  if (!category) throw new Error("Category is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.occurredOn)) {
    throw new Error("Date must be YYYY-MM-DD");
  }
  if (!["income", "expense", "transfer"].includes(data.type)) {
    throw new Error("Invalid type");
  }
  if (data.type === "transfer") {
    if (!data.accountId || !data.transferToAccountId) {
      throw new Error("Transfer needs both source and destination accounts");
    }
    if (data.accountId === data.transferToAccountId) {
      throw new Error("Source and destination must differ");
    }
  }

  // Reverse old effects, apply new
  await reverseEffects(
    {
      type: existing.type,
      amount: existing.amount,
      accountId: existing.accountId,
      transferToAccountId: existing.transferToAccountId,
    },
    session.user.id
  );
  await applyEffects(
    {
      type: data.type,
      amount,
      accountId: data.accountId ?? null,
      transferToAccountId:
        data.type === "transfer" ? data.transferToAccountId ?? null : null,
    },
    session.user.id
  );

  await db
    .update(financeTransaction)
    .set({
      type: data.type,
      amount,
      category,
      note: data.note?.trim() || null,
      occurredOn: data.occurredOn,
      accountId: data.accountId ?? null,
      transferToAccountId:
        data.type === "transfer" ? data.transferToAccountId ?? null : null,
    })
    .where(
      and(
        eq(financeTransaction.id, id),
        eq(financeTransaction.userId, session.user.id)
      )
    );

  const touched = new Set<string>();
  if (existing.accountId) touched.add(existing.accountId);
  if (existing.transferToAccountId) touched.add(existing.transferToAccountId);
  if (data.accountId) touched.add(data.accountId);
  if (data.type === "transfer" && data.transferToAccountId)
    touched.add(data.transferToAccountId);
  let xpAwarded = 0;
  for (const accId of touched) {
    xpAwarded += await markAccountCheckedIn(accId, session.user.id, true);
  }

  const newAchievements = await checkFinanceAchievements(session.user.id);
  revalidatePath("/finance");
  revalidatePath("/");
  revalidatePath("/achievements");
  return { ok: true, xpAwarded, newAchievements };
}

export async function deleteTransaction(id: string) {
  const session = await requireSession();
  const existing = await db.query.financeTransaction.findFirst({
    where: (t, { and: a, eq: e }) =>
      a(e(t.id, id), e(t.userId, session.user.id)),
  });
  if (!existing) return { ok: true };

  await db
    .delete(financeTransaction)
    .where(
      and(
        eq(financeTransaction.id, id),
        eq(financeTransaction.userId, session.user.id)
      )
    );

  await reverseEffects(
    {
      type: existing.type,
      amount: existing.amount,
      accountId: existing.accountId,
      transferToAccountId: existing.transferToAccountId,
    },
    session.user.id
  );

  let xpAwarded = 0;
  const touched = new Set<string>();
  if (existing.accountId) touched.add(existing.accountId);
  if (existing.transferToAccountId) touched.add(existing.transferToAccountId);
  for (const accId of touched) {
    xpAwarded += await markAccountCheckedIn(accId, session.user.id, true);
  }

  const newAchievements = await checkFinanceAchievements(session.user.id);
  revalidatePath("/finance");
  revalidatePath("/");
  revalidatePath("/achievements");
  return { ok: true, xpAwarded, newAchievements };
}

// =====================
// RECURRING
// =====================

function advanceDate(iso: string, cadence: "monthly" | "yearly"): string {
  const [y, m, d] = iso.split("-").map(Number);
  let targetY = y;
  let targetM = m;
  if (cadence === "monthly") {
    targetM = m + 1;
    if (targetM > 12) {
      targetM = 1;
      targetY += 1;
    }
  } else {
    targetY = y + 1;
  }
  // Clamp day to last day of target month (Date(y, m, 0) = last day of month m-1)
  const daysInMonth = new Date(targetY, targetM, 0).getDate();
  const targetD = Math.min(d, daysInMonth);
  return `${targetY}-${String(targetM).padStart(2, "0")}-${String(targetD).padStart(2, "0")}`;
}

export async function createRecurring(data: {
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  cadence: "monthly" | "yearly";
  nextDueOn: string;
  accountId?: string | null;
}) {
  const session = await requireSession();
  const amount = Math.round(Math.abs(Number(data.amount)));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  if (!data.category.trim()) throw new Error("Category is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.nextDueOn)) {
    throw new Error("Next-due date must be YYYY-MM-DD");
  }
  if (data.cadence !== "monthly" && data.cadence !== "yearly") {
    throw new Error("Invalid cadence");
  }

  const [row] = await db
    .insert(financeRecurring)
    .values({
      userId: session.user.id,
      type: data.type,
      amount,
      category: data.category.trim(),
      note: data.note?.trim() || null,
      cadence: data.cadence,
      nextDueOn: data.nextDueOn,
      accountId: data.accountId ?? null,
      active: true,
    })
    .returning();
  const newAchievements = await checkFinanceAchievements(session.user.id);
  revalidatePath("/finance");
  revalidatePath("/achievements");
  return { ...row, newAchievements };
}

export async function updateRecurring(
  id: string,
  data: {
    type: "income" | "expense";
    amount: number;
    category: string;
    note?: string;
    cadence: "monthly" | "yearly";
    nextDueOn: string;
    accountId?: string | null;
  }
) {
  const session = await requireSession();
  const amount = Math.round(Math.abs(Number(data.amount)));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  if (!data.category.trim()) throw new Error("Category is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.nextDueOn)) {
    throw new Error("Next-due date must be YYYY-MM-DD");
  }
  if (data.cadence !== "monthly" && data.cadence !== "yearly") {
    throw new Error("Invalid cadence");
  }

  await db
    .update(financeRecurring)
    .set({
      type: data.type,
      amount,
      category: data.category.trim(),
      note: data.note?.trim() || null,
      cadence: data.cadence,
      nextDueOn: data.nextDueOn,
      accountId: data.accountId ?? null,
    })
    .where(
      and(
        eq(financeRecurring.id, id),
        eq(financeRecurring.userId, session.user.id)
      )
    );
  revalidatePath("/finance");
  return { ok: true };
}

export async function toggleRecurring(id: string, active: boolean) {
  const session = await requireSession();
  await db
    .update(financeRecurring)
    .set({ active })
    .where(
      and(
        eq(financeRecurring.id, id),
        eq(financeRecurring.userId, session.user.id)
      )
    );
  revalidatePath("/finance");
}

export async function deleteRecurring(id: string) {
  const session = await requireSession();
  await db
    .delete(financeRecurring)
    .where(
      and(
        eq(financeRecurring.id, id),
        eq(financeRecurring.userId, session.user.id)
      )
    );
  revalidatePath("/finance");
}

/**
 * Materialize every due occurrence of every active recurring up to `today`.
 * Safe to call repeatedly — nextDueOn advances past today.
 */
export async function processDueRecurrings(userId: string, today: string) {
  const recurrings = await db
    .select()
    .from(financeRecurring)
    .where(
      and(
        eq(financeRecurring.userId, userId),
        eq(financeRecurring.active, true)
      )
    );

  let created = 0;
  const touchedAccounts = new Set<string>();
  for (const r of recurrings) {
    let dueOn = r.nextDueOn;
    while (dueOn <= today) {
      await db.insert(financeTransaction).values({
        userId,
        type: r.type,
        amount: r.amount,
        category: r.category,
        note: r.note ?? null,
        occurredOn: dueOn,
        accountId: r.accountId ?? null,
      });
      if (r.accountId) {
        const delta = r.type === "income" ? r.amount : -r.amount;
        await applyBalanceDelta(r.accountId, userId, delta);
        touchedAccounts.add(r.accountId);
      }
      created += 1;
      dueOn = advanceDate(dueOn, r.cadence);
    }
    if (dueOn !== r.nextDueOn) {
      await db
        .update(financeRecurring)
        .set({ nextDueOn: dueOn })
        .where(eq(financeRecurring.id, r.id));
    }
  }
  // Auto-generated recurring transactions count as a check-in (balance was
  // updated) but don't award XP — the user wasn't actively verifying anything.
  for (const accId of touchedAccounts) {
    await markAccountCheckedIn(accId, userId, false);
  }
  return { created };
}

// =====================
// NET WORTH SNAPSHOTS
// =====================

/**
 * Take at most one snapshot per day.
 * Uses INSERT OR IGNORE via unique (user_id, taken_on) index.
 */
export async function recordNetWorthSnapshotIfNeeded(
  userId: string,
  today: string
) {
  const netWorth = await getNetWorth(userId);
  try {
    await db
      .insert(financeNetWorthSnapshot)
      .values({ userId, takenOn: today, netWorth })
      .onConflictDoNothing();
  } catch {
    // ignore any unique-constraint races
  }
  return { netWorth };
}

/**
 * Delete all finance data for the current user: transactions, recurrings,
 * accounts, net-worth snapshots. Also zero the legacy manual net-worth fallback.
 * Does NOT touch earned XP (general_xp stays).
 */
export async function resetFinanceData() {
  const session = await requireSession();
  const userId = session.user.id;

  // Delete in FK-safe order
  await db
    .delete(financeTransaction)
    .where(eq(financeTransaction.userId, userId));
  await db
    .delete(financeRecurring)
    .where(eq(financeRecurring.userId, userId));
  await db
    .delete(financeNetWorthSnapshot)
    .where(eq(financeNetWorthSnapshot.userId, userId));
  await db
    .delete(financeAccount)
    .where(eq(financeAccount.userId, userId));

  // Reset legacy manual net worth fallback to 0
  const existing = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, userId),
  });
  if (existing) {
    await db
      .update(userSettings)
      .set({ netWorth: 0, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  }

  revalidatePath("/finance");
  revalidatePath("/");
  revalidatePath("/account");
  return { ok: true };
}

// =====================
// CSV IMPORT
// =====================

export type CsvPreviewRow = ParsedCsvRow & {
  duplicate: boolean;
};

export type CsvPreview = {
  accountId: string;
  detectedFormat: string;
  headerRow: string[];
  delimiter: string;
  rows: CsvPreviewRow[];
  errors: { line: number; reason: string; raw: string }[];
  newCount: number;
  duplicateCount: number;
  totalIncome: number;
  totalExpense: number;
};

export async function previewCsvImport(
  accountId: string,
  csvText: string,
  bankKey: string = "auto"
): Promise<CsvPreview> {
  const session = await requireSession();

  const account = await db.query.financeAccount.findFirst({
    where: (a, { and: an, eq: e }) =>
      an(e(a.id, accountId), e(a.userId, session.user.id)),
  });
  if (!account) throw new Error("Account not found");

  const parsed = parseCsv(csvText, bankKey);
  const hashes = parsed.rows.map((r) => r.importHash);

  const existingHashes = new Set<string>();
  if (hashes.length > 0) {
    const existing = await db.query.financeTransaction.findMany({
      where: (t, { and: an, eq: e, inArray: i }) =>
        an(
          e(t.userId, session.user.id),
          e(t.accountId, accountId),
          i(t.importHash, hashes)
        ),
      columns: { importHash: true },
    });
    for (const r of existing) {
      if (r.importHash) existingHashes.add(r.importHash);
    }
  }

  let totalIncome = 0;
  let totalExpense = 0;
  let newCount = 0;
  let duplicateCount = 0;
  const rows: CsvPreviewRow[] = parsed.rows.map((r) => {
    const duplicate = existingHashes.has(r.importHash);
    if (!duplicate) {
      if (r.amount >= 0) totalIncome += r.amount;
      else totalExpense += -r.amount;
      newCount += 1;
    } else {
      duplicateCount += 1;
    }
    return { ...r, duplicate };
  });

  return {
    accountId,
    detectedFormat: parsed.detectedFormat,
    headerRow: parsed.headerRow,
    delimiter: parsed.delimiter,
    rows,
    errors: parsed.errors,
    newCount,
    duplicateCount,
    totalIncome,
    totalExpense,
  };
}

export async function commitCsvImport(
  accountId: string,
  csvText: string,
  bankKey: string = "auto"
): Promise<{
  inserted: number;
  skipped: number;
  xpAwarded: number;
  newAchievements: string[];
}> {
  const session = await requireSession();

  const account = await db.query.financeAccount.findFirst({
    where: (a, { and: an, eq: e }) =>
      an(e(a.id, accountId), e(a.userId, session.user.id)),
  });
  if (!account) throw new Error("Account not found");

  const parsed = parseCsv(csvText, bankKey);
  const hashes = parsed.rows.map((r) => r.importHash);

  const existingHashes = new Set<string>();
  if (hashes.length > 0) {
    const existing = await db.query.financeTransaction.findMany({
      where: (t, { and: an, eq: e, inArray: i }) =>
        an(
          e(t.userId, session.user.id),
          e(t.accountId, accountId),
          i(t.importHash, hashes)
        ),
      columns: { importHash: true },
    });
    for (const r of existing) {
      if (r.importHash) existingHashes.add(r.importHash);
    }
  }

  let inserted = 0;
  let skipped = 0;
  let balanceDelta = 0;
  const seenInBatch = new Set<string>();
  for (const r of parsed.rows) {
    if (existingHashes.has(r.importHash) || seenInBatch.has(r.importHash)) {
      skipped += 1;
      continue;
    }
    seenInBatch.add(r.importHash);
    const absAmount = Math.abs(r.amount);
    const type: "income" | "expense" = r.amount >= 0 ? "income" : "expense";

    try {
      await db.insert(financeTransaction).values({
        userId: session.user.id,
        accountId,
        type,
        amount: absAmount,
        category: r.category,
        note: r.note,
        occurredOn: r.occurredOn,
        importHash: r.importHash,
      });
      inserted += 1;
      balanceDelta += r.amount;
    } catch {
      // unique-index collision — another request raced us
      skipped += 1;
    }
  }

  if (balanceDelta !== 0) {
    await applyBalanceDelta(accountId, session.user.id, balanceDelta);
  }

  let xpAwarded = 0;
  if (inserted > 0) {
    xpAwarded = await markAccountCheckedIn(accountId, session.user.id, true);
  }

  const newAchievements = await checkFinanceAchievements(session.user.id);
  revalidatePath("/finance");
  revalidatePath("/");
  revalidatePath("/achievements");
  return { inserted, skipped, xpAwarded, newAchievements };
}
