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

  const [totalXpResult] = await db
    .select({ total: sum(skill.currentXp) })
    .from(skill)
    .where(eq(skill.userId, userId));
  const totalXp = Number(totalXpResult?.total ?? 0);

  const totalSkills = await db
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
        Welcome back, {session.user.name}
      </h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total XP</CardDescription>
            <CardTitle className="text-3xl">{totalXp.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subskills</CardDescription>
            <CardTitle className="text-3xl">{totalSkills.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Skills</CardDescription>
            <CardTitle className="text-3xl">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {categories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Your Skills</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/skills/${cat.id}`}>
                <Card className="hover:bg-accent/50 transition-colors">
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

      {categories.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-3">
              You haven&apos;t created any skills yet.
            </p>
            <Link
              href="/skills"
              className="text-primary underline hover:text-primary/80"
            >
              Create your first skill &rarr;
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
