"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Badge,
  Spinner,
  Input,
  Chip,
} from "@heroui/react";
import { PRTable } from "@/components/PRTable";
import { PRDetailModal } from "@/components/PRDetailModal";
import { RepoManager } from "@/components/RepoManager";
import type { PullRequest, PRDetail } from "@/types";

export default function Home() {
  const [repos, setRepos] = useState<string[]>([]);
  const [allPRs, setAllPRs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PRDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showRepoManager, setShowRepoManager] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadRepos = useCallback(async () => {
    const res = await fetch("/api/repos");
    const data = await res.json() as { repos: string[] };
    setRepos(data.repos || []);
    return data.repos || [];
  }, []);

  const fetchAllPRs = useCallback(async (repoList: string[]) => {
    if (repoList.length === 0) return;
    setLoading(true);
    const results: PullRequest[] = [];
    await Promise.allSettled(
      repoList.map(async (repo) => {
        try {
          const res = await fetch(`/api/prs?repo=${encodeURIComponent(repo)}`);
          const data = await res.json() as { prs: PullRequest[] };
          if (data.prs) results.push(...data.prs);
        } catch {
          // skip failed repos
        }
      })
    );
    results.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    setAllPRs(results);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRepos().then(fetchAllPRs);
  }, [loadRepos, fetchAllPRs]);

  const handleOpenPR = async (pr: PullRequest) => {
    setLoadingDetail(true);
    setModalOpen(true);
    try {
      const res = await fetch(
        `/api/pr/detail?repo=${encodeURIComponent(pr.repo)}&number=${pr.number}`
      );
      const data = await res.json() as { pr: PRDetail };
      setSelectedPR(data.pr);
    } catch {
      setModalOpen(false);
    }
    setLoadingDetail(false);
  };

  const handleRefresh = async () => {
    const repoList = await loadRepos();
    await fetchAllPRs(repoList);
  };

  const filteredPRs = allPRs.filter(
    (pr) =>
      pr.title.toLowerCase().includes(filterText.toLowerCase()) ||
      pr.repo.toLowerCase().includes(filterText.toLowerCase()) ||
      pr.author.toLowerCase().includes(filterText.toLowerCase())
  );

  const stats = {
    total: allPRs.length,
    needsReview: allPRs.filter((p) => p.reviewState === "pending").length,
    approved: allPRs.filter((p) => p.reviewState === "approved").length,
    changesReq: allPRs.filter((p) => p.reviewState === "changes_requested")
      .length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isBordered maxWidth="full" className="bg-background">
        <NavbarBrand>
          <span className="text-2xl mr-2">🔮</span>
          <span className="font-bold text-xl text-foreground">GitPulse</span>
          <span className="ml-2 text-small text-default-400">
            PR Review Assistant
          </span>
        </NavbarBrand>
        <NavbarContent justify="center">
          <NavbarItem>
            <div className="flex gap-3 items-center">
              <StatChip label="Open PRs" count={stats.total} color="primary" />
              <StatChip
                label="Needs Review"
                count={stats.needsReview}
                color="warning"
              />
              <StatChip
                label="Approved"
                count={stats.approved}
                color="success"
              />
              <StatChip
                label="Changes Req"
                count={stats.changesReq}
                color="danger"
              />
            </div>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              size="sm"
              variant="flat"
              onPress={() => setShowRepoManager(true)}
            >
              Manage Repos
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Button
              size="sm"
              color="primary"
              onPress={handleRefresh}
              isLoading={loading}
            >
              Refresh
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="max-w-full mx-auto px-6 py-6">
        {repos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-default-400 text-lg">No repositories tracked yet</p>
            <Button color="primary" onPress={() => setShowRepoManager(true)}>
              Add Repositories
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <Input
                className="max-w-xs"
                placeholder="Filter PRs..."
                value={filterText}
                onValueChange={setFilterText}
                size="sm"
                isClearable
              />
              {lastRefresh && (
                <span className="text-tiny text-default-400">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" label="Loading pull requests..." />
              </div>
            ) : (
              <PRTable prs={filteredPRs} onOpenPR={handleOpenPR} />
            )}
          </>
        )}
      </main>

      <PRDetailModal
        pr={selectedPR}
        isOpen={modalOpen}
        isLoading={loadingDetail}
        onClose={() => {
          setModalOpen(false);
          setSelectedPR(null);
        }}
      />

      <RepoManager
        isOpen={showRepoManager}
        onClose={() => setShowRepoManager(false)}
        onReposChange={handleRefresh}
      />
    </div>
  );
}

function StatChip({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "primary" | "warning" | "success" | "danger";
}) {
  return (
    <div className="flex items-center gap-1">
      <Badge content={count} color={color} size="sm">
        <Chip size="sm" variant="flat" color={color}>
          {label}
        </Chip>
      </Badge>
    </div>
  );
}
