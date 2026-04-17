import { requireSession } from "@/lib/auth-server";
import { getCategoriesByUser } from "@/modules/skills/queries";
import { db } from "@/lib/db";
import { skill, xpSession } from "@/lib/db/schema";
import { eq, desc, sum } from "drizzle-orm";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const categories = await getCategoriesByUser(userId);
  const activeSkills = categories.filter((c) => c.status === "active");

  const [totalXpResult] = await db
    .select({ total: sum(skill.currentXp) })
    .from(skill)
    .where(eq(skill.userId, userId));
  const totalXp = Number(totalXpResult?.total ?? 0);

  const totalSubskills = await db
    .select({ id: skill.id })
    .from(skill)
    .where(eq(skill.userId, userId));

  const recentSessions = await db
    .select({
      id: xpSession.id,
      xpGained: xpSession.xpGained,
      note: xpSession.note,
      loggedAt: xpSession.loggedAt,
      skillName: skill.name,
    })
    .from(xpSession)
    .innerJoin(skill, eq(xpSession.skillId, skill.id))
    .where(eq(xpSession.userId, userId))
    .orderBy(desc(xpSession.loggedAt))
    .limit(5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome back, <span className="text-glow">{session.user.name}</span>
      </h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-xp/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xp/70 uppercase text-xs tracking-wider">Total XP</CardDescription>
            <CardTitle className="text-3xl font-mono text-xp">
              {totalXp.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-glow/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-glow/70 uppercase text-xs tracking-wider">Active Focus</CardDescription>
            <CardTitle className="text-3xl font-mono text-glow">
              {activeSkills.length}/3
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-glow-purple/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-glow-purple/70 uppercase text-xs tracking-wider">Subskills</CardDescription>
            <CardTitle className="text-3xl font-mono text-glow-purple">
              {totalSubskills.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {activeSkills.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Current Focus</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeSkills.map((cat) => (
              <Link key={cat.id} href={`/skills/${cat.id}`}>
                <Card className="hover:border-glow/40 transition-all border-glow/20 glow-green">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon ?? "📚"}</span>
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">
                      {cat.skillCount}{" "}
                      {cat.skillCount === 1 ? "subskill" : "subskills"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeSkills.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-3">
              You haven&apos;t set any active focus skills yet.
            </p>
            <Link
              href="/skills"
              className="text-primary underline hover:text-primary/80"
            >
              Choose your focus &rarr;
            </Link>
          </CardContent>
        </Card>
      )}

      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <span className="font-medium text-sm">{s.skillName}</span>
                  {s.note && (
                    <span className="text-muted-foreground text-sm ml-2">
                      — {s.note}
                    </span>
                  )}
                </div>
                <Badge variant="secondary">+{s.xpGained} XP</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
