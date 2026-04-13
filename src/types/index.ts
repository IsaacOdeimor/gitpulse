export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  repo: string;
  author: string;
  authorAvatar: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  reviewState: "approved" | "changes_requested" | "pending" | "commented";
  ciStatus: "success" | "failure" | "pending" | "none";
  additions: number;
  deletions: number;
  changedFiles: number;
  labels: string[];
  draft: boolean;
  commentsCount: number;
  reviewsCount: number;
  body: string | null;
  headBranch: string;
  baseBranch: string;
}

export interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
  blobUrl: string;
}

export interface PRDetail extends PullRequest {
  files: PRFile[];
  reviews: PRReview[];
  commits: PRCommit[];
}

export interface PRReview {
  id: number;
  author: string;
  authorAvatar: string;
  state: string;
  body: string;
  submittedAt: string;
}

export interface PRCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface RepoStats {
  totalPRs: number;
  openPRs: number;
  approvedPRs: number;
  needsReview: number;
}
