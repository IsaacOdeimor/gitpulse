import { NextResponse } from "next/server";
import { fetchUserRepos } from "@/lib/github";

export async function GET() {
  try {
    const repos = await fetchUserRepos();
    return NextResponse.json({ repos });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
