"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  Button,
  Tooltip,
} from "@heroui/react";
import type { PullRequest } from "@/types";

interface Props {
  prs: PullRequest[];
  onOpenPR: (pr: PullRequest) => void;
}

const reviewStateConfig = {
  approved: { color: "success" as const, label: "Approved" },
  changes_requested: { color: "danger" as const, label: "Changes Req" },
  pending: { color: "warning" as const, label: "Pending" },
  commented: { color: "default" as const, label: "Commented" },
};

const ciStateConfig = {
  success: { color: "success" as const, label: "✓ CI" },
  failure: { color: "danger" as const, label: "✗ CI" },
  pending: { color: "warning" as const, label: "⟳ CI" },
  none: { color: "default" as const, label: "— CI" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function PRTable({ prs, onOpenPR }: Props) {
  if (prs.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-default-400">
        <span className="text-4xl mb-3">🎉</span>
        <p>No open pull requests found.</p>
      </div>
    );
  }

  return (
    <Table
      aria-label="Pull requests table"
      isStriped
      removeWrapper
      classNames={{ th: "bg-default-100 text-default-600" }}
    >
      <TableHeader>
        <TableColumn>PR</TableColumn>
        <TableColumn>REPOSITORY</TableColumn>
        <TableColumn>AUTHOR</TableColumn>
        <TableColumn>REVIEW</TableColumn>
        <TableColumn>CI</TableColumn>
        <TableColumn>CHANGES</TableColumn>
        <TableColumn>UPDATED</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {prs.map((pr) => {
          const review = reviewStateConfig[pr.reviewState];
          const ci = ciStateConfig[pr.ciStatus];
          return (
            <TableRow key={`${pr.repo}-${pr.number}`}>
              <TableCell>
                <div className="flex flex-col max-w-xs">
                  <div className="flex items-center gap-1.5">
                    {pr.draft && (
                      <Chip size="sm" variant="flat" color="default">
                        Draft
                      </Chip>
                    )}
                    <span className="text-sm font-medium text-foreground truncate">
                      {pr.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-tiny text-default-400">
                      #{pr.number}
                    </span>
                    {pr.labels.slice(0, 2).map((l) => (
                      <Chip key={l} size="sm" variant="dot" color="secondary">
                        {l}
                      </Chip>
                    ))}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-default-600">{pr.repo}</span>
                <div className="text-tiny text-default-400">
                  {pr.headBranch} → {pr.baseBranch}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar src={pr.authorAvatar} size="sm" name={pr.author} />
                  <span className="text-sm">{pr.author}</span>
                </div>
              </TableCell>
              <TableCell>
                <Chip size="sm" color={review.color} variant="flat">
                  {review.label}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" color={ci.color} variant="flat">
                  {ci.label}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="text-tiny">
                  <span className="text-success">+{pr.additions}</span>
                  {" / "}
                  <span className="text-danger">-{pr.deletions}</span>
                </div>
                <div className="text-tiny text-default-400">
                  {pr.changedFiles} files
                </div>
              </TableCell>
              <TableCell>
                <span className="text-tiny text-default-400">
                  {timeAgo(pr.updatedAt)}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={() => onOpenPR(pr)}
                >
                  Review
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
