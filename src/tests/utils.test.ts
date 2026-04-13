import { describe, it, expect } from "vitest";

// Test utility functions that don't require GitHub API

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mapReviewState(
  reviews: Array<{ state: string }>
): "approved" | "changes_requested" | "pending" | "commented" {
  if (reviews.some((r) => r.state === "CHANGES_REQUESTED"))
    return "changes_requested";
  if (reviews.some((r) => r.state === "APPROVED")) return "approved";
  if (reviews.some((r) => r.state === "COMMENTED")) return "commented";
  return "pending";
}

function mapCiStatus(
  status: string | null | undefined
): "success" | "failure" | "pending" | "none" {
  if (!status) return "none";
  if (status === "success") return "success";
  if (status === "failure" || status === "error") return "failure";
  return "pending";
}

describe("timeAgo", () => {
  it("returns minutes for recent times", () => {
    const date = new Date(Date.now() - 5 * 60000).toISOString();
    expect(timeAgo(date)).toBe("5m ago");
  });

  it("returns hours for times within a day", () => {
    const date = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(timeAgo(date)).toBe("3h ago");
  });

  it("returns days for older times", () => {
    const date = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(timeAgo(date)).toBe("2d ago");
  });
});

describe("mapReviewState", () => {
  it("returns changes_requested when any review requests changes", () => {
    expect(
      mapReviewState([
        { state: "APPROVED" },
        { state: "CHANGES_REQUESTED" },
      ])
    ).toBe("changes_requested");
  });

  it("returns approved when all reviews approve", () => {
    expect(mapReviewState([{ state: "APPROVED" }])).toBe("approved");
  });

  it("returns commented when there are only comments", () => {
    expect(mapReviewState([{ state: "COMMENTED" }])).toBe("commented");
  });

  it("returns pending when no reviews exist", () => {
    expect(mapReviewState([])).toBe("pending");
  });
});

describe("mapCiStatus", () => {
  it("returns none for null status", () => {
    expect(mapCiStatus(null)).toBe("none");
  });

  it("returns success for passing CI", () => {
    expect(mapCiStatus("success")).toBe("success");
  });

  it("returns failure for failed CI", () => {
    expect(mapCiStatus("failure")).toBe("failure");
    expect(mapCiStatus("error")).toBe("failure");
  });

  it("returns pending for in-progress CI", () => {
    expect(mapCiStatus("pending")).toBe("pending");
  });
});

describe("PR filtering logic", () => {
  const prs = [
    {
      title: "Fix authentication bug",
      repo: "acme/backend",
      author: "alice",
      number: 1,
    },
    {
      title: "Add dark mode",
      repo: "acme/frontend",
      author: "bob",
      number: 2,
    },
    {
      title: "Update dependencies",
      repo: "acme/backend",
      author: "charlie",
      number: 3,
    },
  ];

  function filterPRs(filter: string) {
    const f = filter.toLowerCase();
    return prs.filter(
      (pr) =>
        pr.title.toLowerCase().includes(f) ||
        pr.repo.toLowerCase().includes(f) ||
        pr.author.toLowerCase().includes(f)
    );
  }

  it("filters by title", () => {
    expect(filterPRs("authentication")).toHaveLength(1);
  });

  it("filters by repo", () => {
    expect(filterPRs("frontend")).toHaveLength(1);
  });

  it("filters by author", () => {
    expect(filterPRs("alice")).toHaveLength(1);
  });

  it("returns all for empty filter", () => {
    expect(filterPRs("")).toHaveLength(3);
  });

  it("returns empty for no match", () => {
    expect(filterPRs("zzznomatch")).toHaveLength(0);
  });
});
