# GitPulse

A dashboard for tracking pull requests across multiple GitHub repositories.

GitPulse shows open PRs, review status, CI state, comments, commits, and changed files in one place so you do not have to keep jumping between repo tabs.

## Why I built it

Following PRs across multiple repos gets annoying quickly. You open one repo for CI, another for review comments, another for commits, then repeat the same thing again later.

I built GitPulse to make that workflow simpler: one dashboard, all the PRs I care about, and enough detail to know what needs attention.

## What it does

- Tracks open PRs across selected repositories
- Shows CI status at a glance
- Shows review state: approved, changes requested, or pending
- Opens PR details with files, commits, reviews, and comments
- Caches GitHub API responses locally to reduce rate-limit pressure
- Lets you add or remove repos from the dashboard

## Tech stack

- Next.js 14
- TypeScript
- Tailwind CSS + HeroUI
- Octokit REST API
- SQLite via `better-sqlite3`
- Vitest

## Run locally

```bash
git clone https://github.com/IsaacOdeimor/gitpulse.git
cd gitpulse
npm install
```

Set a GitHub token:

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`, then add repos from the repo manager.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | yes | GitHub personal access token |
| `DB_PATH` | no | SQLite database path |

## Project structure

```txt
src/
├── app/
│   ├── api/
│   │   ├── prs/          # list PRs
│   │   ├── pr/detail/    # PR details
│   │   └── repos/        # repo management
│   └── page.tsx          # dashboard UI
├── components/
│   ├── PRTable.tsx       # PR list
│   ├── PRDetailModal.tsx # PR details
│   └── RepoManager.tsx   # tracked repos
├── lib/
│   ├── github.ts         # GitHub API wrapper
│   └── db.ts             # SQLite cache
└── types/                # shared types
```

## Development

```bash
npm run dev
npm run build
npm run test
```

## Notes

The main things worth reviewing are the GitHub API wrapper, caching layer, PR status normalization, and the way the frontend turns GitHub data into a quick review workflow.
