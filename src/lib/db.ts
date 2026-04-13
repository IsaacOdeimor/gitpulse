import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { PullRequest, PRDetail } from "@/types";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "gitpulse.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prs (
      id INTEGER PRIMARY KEY,
      number INTEGER NOT NULL,
      repo TEXT NOT NULL,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL,
      UNIQUE(repo, number)
    );

    CREATE TABLE IF NOT EXISTS pr_details (
      id INTEGER PRIMARY KEY,
      repo TEXT NOT NULL,
      number INTEGER NOT NULL,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL,
      UNIQUE(repo, number)
    );

    CREATE TABLE IF NOT EXISTS repo_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT UNIQUE NOT NULL,
      added_at INTEGER NOT NULL
    );
  `);
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedPRs(repo: string): PullRequest[] | null {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT data, cached_at FROM prs WHERE repo = ? ORDER BY number DESC"
    )
    .all(repo) as Array<{ data: string; cached_at: number }>;

  if (rows.length === 0) return null;
  const now = Date.now();
  if (now - rows[0].cached_at > CACHE_TTL) return null;

  return rows.map((r) => JSON.parse(r.data) as PullRequest);
}

export function cachePRs(repo: string, prs: PullRequest[]) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO prs (id, number, repo, data, cached_at)
    VALUES (@id, @number, @repo, @data, @cachedAt)
  `);
  const now = Date.now();
  const insertMany = db.transaction((items: PullRequest[]) => {
    for (const pr of items) {
      stmt.run({
        id: pr.id,
        number: pr.number,
        repo: pr.repo,
        data: JSON.stringify(pr),
        cachedAt: now,
      });
    }
  });
  insertMany(prs);
}

export function getCachedPRDetail(
  repo: string,
  number: number
): PRDetail | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT data, cached_at FROM pr_details WHERE repo = ? AND number = ?"
    )
    .get(repo, number) as { data: string; cached_at: number } | undefined;

  if (!row) return null;
  if (Date.now() - row.cached_at > CACHE_TTL) return null;
  return JSON.parse(row.data) as PRDetail;
}

export function cachePRDetail(repo: string, detail: PRDetail) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO pr_details (repo, number, data, cached_at)
    VALUES (?, ?, ?, ?)
  `).run(repo, detail.number, JSON.stringify(detail), Date.now());
}

export function getTrackedRepos(): string[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT full_name FROM repo_list ORDER BY added_at DESC")
    .all() as Array<{ full_name: string }>;
  return rows.map((r) => r.full_name);
}

export function addTrackedRepo(fullName: string) {
  const db = getDb();
  db.prepare(
    "INSERT OR IGNORE INTO repo_list (full_name, added_at) VALUES (?, ?)"
  ).run(fullName, Date.now());
}

export function removeTrackedRepo(fullName: string) {
  const db = getDb();
  db.prepare("DELETE FROM repo_list WHERE full_name = ?").run(fullName);
}
