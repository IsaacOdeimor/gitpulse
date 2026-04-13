import { NextRequest, NextResponse } from "next/server";
import { fetchUserRepos } from "@/lib/github";
import { getTrackedRepos, addTrackedRepo, removeTrackedRepo } from "@/lib/db";

export async function GET() {
  const tracked = getTrackedRepos();
  return NextResponse.json({ repos: tracked });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { repo?: string };
  if (!body.repo) {
    return NextResponse.json({ error: "repo required" }, { status: 400 });
  }
  addTrackedRepo(body.repo);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json() as { repo?: string };
  if (!body.repo) {
    return NextResponse.json({ error: "repo required" }, { status: 400 });
  }
  removeTrackedRepo(body.repo);
  return NextResponse.json({ ok: true });
}
