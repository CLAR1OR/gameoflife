import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-server";
import { getUserSettings } from "@/modules/settings/queries";
import { SKILL_TEMPLATES } from "@/lib/skill-templates";
import { getCategoriesByUser } from "@/modules/skills/queries";
import { Toaster } from "@/components/ui/sonner";
import { WelcomeWizard } from "./welcome-wizard";

export default async function WelcomePage() {
  const session = await requireSession();
  const settings = await getUserSettings(session.user.id);

  // Already onboarded → don't show the wizard again. The link in
  // Account → Backup will re-trigger if needed.
  if (settings.onboardedAt != null) {
    redirect("/");
  }

  // The user might have already activated a skill (e.g. before this
  // wizard existed) — don't try to show one as a "pick a starter" if so.
  const categories = await getCategoriesByUser(session.user.id);
  const alreadyHasSkill = categories.length > 0;

  return (
    <>
      <WelcomeWizard
        name={session.user.name}
        templates={SKILL_TEMPLATES.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          icon: t.icon,
        }))}
        alreadyHasSkill={alreadyHasSkill}
        currentYearlyGoal={settings.yearlyBookGoal}
      />
      <Toaster />
    </>
  );
}
