import { NextRequest, NextResponse } from "next/server";
import { fetchPRDetail } from "@/lib/github";
import { getCachedPRDetail, cachePRDetail } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");
  const number = searchParams.get("number");

  if (!repo || !number) {
    return NextResponse.json(
      { error: "repo and number params required" },
      { status: 400 }
    );
  }

  const prNumber = parseInt(number, 10);
  const cached = getCachedPRDetail(repo, prNumber);
  if (cached) {
    return NextResponse.json({ pr: cached, cached: true });
  }

  try {
    const pr = await fetchPRDetail(repo, prNumber);
    cachePRDetail(repo, pr);
    return NextResponse.json({ pr, cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
