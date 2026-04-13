import { NextRequest, NextResponse } from "next/server";
import { fetchOpenPRs } from "@/lib/github";
import { getCachedPRs, cachePRs } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");

  if (!repo) {
    return NextResponse.json({ error: "repo param required" }, { status: 400 });
  }

  // Try cache first
  const cached = getCachedPRs(repo);
  if (cached) {
    return NextResponse.json({ prs: cached, cached: true });
  }

  try {
    const prs = await fetchOpenPRs(repo);
    cachePRs(repo, prs);
    return NextResponse.json({ prs, cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
