"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Spinner,
  Code,
  Divider,
} from "@heroui/react";
import type { PRDetail } from "@/types";

interface Props {
  pr: PRDetail | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

const reviewStateColor = {
  APPROVED: "success" as const,
  CHANGES_REQUESTED: "danger" as const,
  COMMENTED: "warning" as const,
  PENDING: "default" as const,
};

function DiffViewer({ patch }: { patch?: string }) {
  if (!patch) return <p className="text-default-400 text-sm">No diff available</p>;

  return (
    <div className="font-mono text-xs overflow-auto max-h-96 bg-default-50 rounded-lg p-3">
      {patch.split("\n").map((line, i) => {
        let cls = "text-default-600";
        if (line.startsWith("+") && !line.startsWith("+++")) cls = "text-success bg-success-50/30";
        else if (line.startsWith("-") && !line.startsWith("---")) cls = "text-danger bg-danger-50/30";
        else if (line.startsWith("@@")) cls = "text-secondary";
        return (
          <div key={i} className={`leading-5 px-1 ${cls}`}>
            {line || " "}
          </div>
        );
      })}
    </div>
  );
}

export function PRDetailModal({ pr, isOpen, isLoading, onClose }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      classNames={{ body: "py-4" }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Loading PR details...</span>
                </div>
              ) : pr ? (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-default-400">#{pr.number}</span>
                    <span className="font-bold text-lg">{pr.title}</span>
                    {pr.draft && (
                      <Chip size="sm" variant="flat">Draft</Chip>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-default-500">
                    <span>{pr.repo}</span>
                    <span>·</span>
                    <span>{pr.headBranch} → {pr.baseBranch}</span>
                    <span>·</span>
                    <span className="text-success">+{pr.additions}</span>
                    <span className="text-danger">-{pr.deletions}</span>
                    <span>·</span>
                    <span>{pr.changedFiles} files</span>
                  </div>
                </div>
              ) : null}
            </ModalHeader>
            <ModalBody>
              {isLoading && (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              )}
              {pr && !isLoading && (
                <Tabs aria-label="PR details">
                  <Tab key="diff" title={`Files (${pr.files.length})`}>
                    <div className="flex flex-col gap-4 mt-2">
                      {pr.files.map((file) => (
                        <div key={file.filename} className="border border-default-200 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 bg-default-100">
                            <div className="flex items-center gap-2">
                              <Chip size="sm" variant="flat" color={
                                file.status === "added" ? "success" :
                                file.status === "removed" ? "danger" : "warning"
                              }>
                                {file.status}
                              </Chip>
                              <Code className="text-xs">{file.filename}</Code>
                            </div>
                            <div className="text-tiny">
                              <span className="text-success">+{file.additions}</span>
                              {" "}
                              <span className="text-danger">-{file.deletions}</span>
                            </div>
                          </div>
                          <DiffViewer patch={file.patch} />
                        </div>
                      ))}
                    </div>
                  </Tab>

                  <Tab key="reviews" title={`Reviews (${pr.reviews.length})`}>
                    <div className="flex flex-col gap-3 mt-2">
                      {pr.reviews.length === 0 && (
                        <p className="text-default-400 text-center py-8">No reviews yet</p>
                      )}
                      {pr.reviews.map((review) => (
                        <div key={review.id} className="border border-default-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar src={review.authorAvatar} size="sm" name={review.author} />
                              <span className="font-medium">{review.author}</span>
                            </div>
                            <Chip
                              size="sm"
                              color={reviewStateColor[review.state as keyof typeof reviewStateColor] ?? "default"}
                              variant="flat"
                            >
                              {review.state.replace(/_/g, " ")}
                            </Chip>
                          </div>
                          {review.body && (
                            <p className="text-sm text-default-600 mt-2">{review.body}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Tab>

                  <Tab key="commits" title={`Commits (${pr.commits.length})`}>
                    <div className="flex flex-col gap-2 mt-2">
                      {pr.commits.map((commit) => (
                        <div key={commit.sha} className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                          <Code className="text-xs shrink-0">{commit.sha}</Code>
                          <span className="text-sm flex-1 truncate">{commit.message}</span>
                          <span className="text-tiny text-default-400 shrink-0">{commit.author}</span>
                        </div>
                      ))}
                    </div>
                  </Tab>

                  <Tab key="description" title="Description">
                    <div className="mt-2 p-4 bg-default-50 rounded-lg">
                      {pr.body ? (
                        <p className="text-sm text-default-700 whitespace-pre-wrap">{pr.body}</p>
                      ) : (
                        <p className="text-default-400">No description provided.</p>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Close
              </Button>
              {pr && (
                <Button
                  color="primary"
                  as="a"
                  href={pr.url}
                  target="_blank"
                >
                  Open on GitHub ↗
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
