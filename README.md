# 🔮 GitPulse

> GitHub PR Review Assistant — track all your open pull requests across repos in one dashboard.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![HeroUI](https://img.shields.io/badge/HeroUI-v2-purple)
![SQLite](https://img.shields.io/badge/Cache-SQLite-green)

## Features

- 📊 **Unified Dashboard** — all open PRs across tracked repositories in one view
- 🔍 **PR Detail View** — inline diff viewer with syntax highlighting, review history, commits
- ✅ **CI Status Indicators** — real-time CI pass/fail per PR
- 🏷️ **Review Status Chips** — Approved / Changes Requested / Pending at a glance
- 💬 **Notification Counts** — comment counts, review counts per PR
- 🗄️ **SQLite Caching** — 5-minute cache to avoid GitHub rate limits
- ➕ **Repo Manager** — add/remove repos to track; auto-discovers your GitHub repos

## Stack

- **Next.js 14** App Router + TypeScript strict
- **Octokit REST** for GitHub API
- **HeroUI v2** + Tailwind for UI
- **better-sqlite3** for caching
- **Vitest** for tests

## Setup

```bash
npm install

# Set your GitHub token (needs repo + read:org scopes)
export GITHUB_TOKEN=ghp_your_token_here

npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Manage Repos**, add your repositories.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub personal access token (repo scope) |
| `DB_PATH` | No | SQLite database path (default: `./gitpulse.db`) |

## Development

```bash
npm run dev      # Development server
npm run build    # Production build
npm run test     # Run tests
```

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── prs/route.ts        # List PRs for a repo
│   │   ├── pr/detail/route.ts  # PR detail with files/reviews/commits
│   │   └── repos/              # Tracked repo management + GitHub search
│   └── page.tsx                # Main dashboard
├── components/
│   ├── PRTable.tsx             # Sortable PR list with status chips
│   ├── PRDetailModal.tsx       # Full PR detail with diff tabs
│   └── RepoManager.tsx         # Add/remove tracked repos
├── lib/
│   ├── github.ts               # Octokit wrapper
│   └── db.ts                   # SQLite cache layer
└── types/index.ts              # Shared TypeScript types
```
