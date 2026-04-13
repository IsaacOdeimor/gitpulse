import { Octokit } from "@octokit/rest";
import type {
  PullRequest,
  PRDetail,
  PRFile,
  PRReview,
  PRCommit,
} from "@/types";

let _octokit: Octokit | null = null;

export function getOctokit(): Octokit {
  if (_octokit) return _octokit;
  const token = process.env.GITHUB_TOKEN;
  _octokit = new Octokit({ auth: token });
  return _octokit;
}

function mapReviewState(
  reviews: Array<{ state: string }>
): PullRequest["reviewState"] {
  if (reviews.some((r) => r.state === "CHANGES_REQUESTED"))
    return "changes_requested";
  if (reviews.some((r) => r.state === "APPROVED")) return "approved";
  if (reviews.some((r) => r.state === "COMMENTED")) return "commented";
  return "pending";
}

function mapCiStatus(
  status: string | null | undefined
): PullRequest["ciStatus"] {
  if (!status) return "none";
  if (status === "success") return "success";
  if (status === "failure" || status === "error") return "failure";
  return "pending";
}

export async function fetchOpenPRs(repo: string): Promise<PullRequest[]> {
  const octokit = getOctokit();
  const [owner, repoName] = repo.split("/");

  const { data: prs } = await octokit.pulls.list({
    owner,
    repo: repoName,
    state: "open",
    per_page: 50,
  });

  const results: PullRequest[] = [];

  for (const pr of prs) {
    // Get reviews
    const { data: reviews } = await octokit.pulls.listReviews({
      owner,
      repo: repoName,
      pull_number: pr.number,
    });

    // Get combined status (CI)
    let ciStatus: PullRequest["ciStatus"] = "none";
    try {
      const { data: status } = await octokit.repos.getCombinedStatusForRef({
        owner,
        repo: repoName,
        ref: pr.head.sha,
      });
      ciStatus = mapCiStatus(status.state);
    } catch {
      // no CI configured
    }

    results.push({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      repo,
      author: pr.user?.login ?? "unknown",
      authorAvatar: pr.user?.avatar_url ?? "",
      url: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      reviewState: mapReviewState(
        reviews.map((r) => ({ state: r.state }))
      ),
      ciStatus,
      additions: (pr as Record<string, unknown> & { additions?: number }).additions ?? 0,
      deletions: (pr as Record<string, unknown> & { deletions?: number }).deletions ?? 0,
      changedFiles: (pr as Record<string, unknown> & { changed_files?: number }).changed_files ?? 0,
      labels: pr.labels.map((l) => l.name),
      draft: pr.draft ?? false,
      commentsCount: (pr as Record<string, unknown> & { comments?: number }).comments ?? 0,
      reviewsCount: reviews.length,
      body: pr.body ?? null,
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
    });
  }

  return results;
}

export async function fetchPRDetail(
  repo: string,
  number: number
): Promise<PRDetail> {
  const octokit = getOctokit();
  const [owner, repoName] = repo.split("/");

  const [{ data: pr }, { data: filesData }, { data: reviewsData }, { data: commitsData }] =
    await Promise.all([
      octokit.pulls.get({ owner, repo: repoName, pull_number: number }),
      octokit.pulls.listFiles({
        owner,
        repo: repoName,
        pull_number: number,
        per_page: 100,
      }),
      octokit.pulls.listReviews({
        owner,
        repo: repoName,
        pull_number: number,
      }),
      octokit.pulls.listCommits({
        owner,
        repo: repoName,
        pull_number: number,
        per_page: 50,
      }),
    ]);

  let ciStatus: PullRequest["ciStatus"] = "none";
  try {
    const { data: status } = await octokit.repos.getCombinedStatusForRef({
      owner,
      repo: repoName,
      ref: pr.head.sha,
    });
    ciStatus = mapCiStatus(status.state);
  } catch {
    // no CI
  }

  const files: PRFile[] = filesData.map((f) => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch,
    blobUrl: f.blob_url,
  }));

  const reviews: PRReview[] = reviewsData.map((r) => ({
    id: r.id,
    author: r.user?.login ?? "unknown",
    authorAvatar: r.user?.avatar_url ?? "",
    state: r.state,
    body: r.body ?? "",
    submittedAt: r.submitted_at ?? "",
  }));

  const commits: PRCommit[] = commitsData.map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0],
    author: c.commit.author?.name ?? "unknown",
    date: c.commit.author?.date ?? "",
  }));

  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    state: pr.state,
    repo,
    author: pr.user?.login ?? "unknown",
    authorAvatar: pr.user?.avatar_url ?? "",
    url: pr.html_url,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    reviewState: mapReviewState(reviewsData.map((r) => ({ state: r.state }))),
    ciStatus,
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
    changedFiles: pr.changed_files ?? 0,
    labels: pr.labels.map((l) => l.name),
    draft: pr.draft ?? false,
    commentsCount: pr.comments ?? 0,
    reviewsCount: reviewsData.length,
    body: pr.body ?? null,
    headBranch: pr.head.ref,
    baseBranch: pr.base.ref,
    files,
    reviews,
    commits,
  };
}

export async function fetchUserRepos(): Promise<string[]> {
  const octokit = getOctokit();
  const { data } = await octokit.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: "pushed",
    type: "owner",
  });
  return data.map((r) => r.full_name);
}
