/**
 * Fire a celebration. Called from anywhere on the client after a server
 * action returns `newAchievements` (string[]). The CelebrationProvider
 * picks this up, fetches full achievement data, queues them, and shows
 * the level-up modal one at a time.
 *
 * Use this in preference to toast.success("🏆 ...") for achievement
 * unlocks — celebrations persist until dismissed and include icon +
 * description.
 */
export function celebrate(achievementNames: string[]) {
  if (typeof window === "undefined") return;
  if (!achievementNames || achievementNames.length === 0) return;
  window.dispatchEvent(
    new CustomEvent("celebrate-achievements", {
      detail: { names: achievementNames },
    })
  );
}
