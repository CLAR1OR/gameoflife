# Game of Life

A self-hosted, gamified personal-dashboard web app. Turn the slow projects of
adult life — learning a skill, staying in touch with friends, reading more
books, getting on top of your finances — into something with XP, levels,
streaks and achievements.

Built with Next.js, SQLite (via Drizzle), and Tailwind. Designed to live on
your own server, hold your own data, and grow with what you actually care
about tracking.

## What's inside

| Module | What it does |
| --- | --- |
| **Skills** | Skill trees with prerequisites, milestones, and stages. Templates seed common skills (cooking, languages, music, …) and grow from there. |
| **Quests** | Long-running personal goals — a main quest plus several side quests. Tasks tick off, completed quests grant XP. |
| **Habits** | Daily or flexible-cadence ("3x/week") habits with current/best streaks, a year-long activity heatmap, weekly progress bars, archive + reorder. |
| **Books** | Reading list with status (want / reading / read), per-read history, page counts, ratings, Goodreads CSV import, reading-list challenges. |
| **Places** | Where you've been — pinned to a Leaflet world map (Equal-Earth projection), grouped into trips, country detail pages, hike outings with distance + elevation. |
| **Friends** | Address book with cadence-based "due to reach out" reminders, contact methods, tags, life-event log, birthday widget, gallery view, interaction heatmap. |
| **Finance** | Multiple accounts (bank / cash / crypto / debt …), net-worth tracking, recurring income/expenses, CSV import, snapshot history. |
| **Achievements** | A unified trophy room — per-module grouping (Places, Hikes, Friends, Finance, Books, Habits, Quests, Skill, Custom), progress bars on locked goals, filters + search + up-next, and grid / Steam-style list / timeline views. |
| **Backup & restore** | Single-file JSON export of every user-owned row; restore into the same account or a brand-new one. |

The whole app is one local-first SQLite database. No third-party SaaS — no
analytics, no telemetry, no LLM calls. Your data lives in
`data/gameoflife.db`.

## Tech stack

- **Next.js 16** (App Router, React Server Components, Server Actions, Turbopack)
- **React 19** + **Tailwind CSS v4** + **shadcn/ui** + **Base UI**
- **Drizzle ORM** on **better-sqlite3**
- **Better Auth** for sessions
- **Leaflet** + **d3-geo** + **world-atlas** for maps
- TypeScript strict throughout

## Run it locally

```bash
git clone <repo-url> gameoflife
cd gameoflife
npm install
```

Create a `.env.local`:

```
BETTER_AUTH_SECRET=<run: openssl rand -hex 32>
BETTER_AUTH_URL=http://localhost:3000
```

Then:

```bash
npm run dev          # → http://localhost:3000
npm run build        # production build
npm start            # serve the production build
```

The SQLite database file (`data/gameoflife.db`) is created automatically on
first boot. Register a user in the UI; everything is scoped per user.

## Self-host with Docker

A multi-stage `Dockerfile` and `docker-compose.yml` are included. The image
uses Next.js standalone output for a small (~250 MB) final image. SQLite and
user-uploaded photos are persisted via host volumes.

```bash
# On your home server:
git clone <repo-url> gameoflife
cd gameoflife

# Create .env next to docker-compose.yml:
cat > .env <<EOF
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_URL=https://gameoflife.yourdomain.tld
HOST_PORT=3000
EOF

docker compose up -d --build
```

| Path on host | Path in container | What it holds |
| --- | --- | --- |
| `./data` | `/app/data` | SQLite database |
| `./uploads/places` | `/app/public/places` | Place + visit photos |
| `./uploads/friends` | `/app/public/friends` | Friend photos |

Put it behind whatever reverse proxy your home server uses (Caddy, Traefik,
nginx, …). `BETTER_AUTH_URL` must match the public URL — Better Auth uses it
for cookies and CSRF, and `NEXT_PUBLIC_BETTER_AUTH_URL` is baked into the
client bundle at build time, so set it correctly **before** the first build.
Change it later → rebuild.

### Updating

```bash
git pull
docker compose up -d --build
```

The `data/` and `uploads/` volumes survive rebuilds.

### Backups

Everything important is two folders:

```bash
tar czf gameoflife-$(date +%F).tar.gz data uploads
```

There's also an in-app JSON backup (Account → Export / Import) that round-trips
the entire user record into a single file.

## Project layout

```
app/(dashboard)/        Server pages per module
components/             Client + shared UI
lib/db/                 Drizzle schema + connection
lib/                    Achievements engines, helpers, date utils
modules/<feature>/      Server actions + queries + types per module
public/                 Static assets + uploaded photos at runtime
```

Each module typically has:

- `queries.ts` — server-side reads (imports `db`, runtime-server only)
- `actions.ts` — `"use server"` mutations
- `types.ts` — pure types, safe to import from client components
- `constants.ts` — feature flags / XP values / etc.

Pages live under `app/(dashboard)/<module>/`; the corresponding client view
sits next to its server page in a `*-view.tsx`.

## Notes for contributors / future-you

- The schema lives in [`lib/db/schema.ts`](lib/db/schema.ts). There are no
  migration files — the schema is `CREATE TABLE`-on-first-boot, and ALTER
  statements are run by hand against `data/gameoflife.db` when columns are
  added. The deprecated columns left in place (e.g. `place.distanceKm`) are
  kept solely so older JSON backups still restore.
- Type-import hygiene matters: any module that imports `db` from `@/lib/db`
  is server-only. Client components must import types from
  `modules/<x>/types.ts`, never from `queries.ts`, or Turbopack may drag
  `better-sqlite3` into the browser bundle and blow up with
  `require is not defined`.
- The achievement system is generic: each module owns a list of
  `AchievementSpec`s + a stat-computation function, and the shared
  [`lib/achievement-engine.ts`](lib/achievement-engine.ts) handles seeding +
  unlocking.

## License

No license file — treat it as personal/private code unless you change that.
