"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Chip,
  Spinner,
} from "@heroui/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReposChange: () => void;
}

export function RepoManager({ isOpen, onClose, onReposChange }: Props) {
  const [tracked, setTracked] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [manual, setManual] = useState("");
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTracked = async () => {
    const res = await fetch("/api/repos");
    const data = await res.json() as { repos: string[] };
    setTracked(data.repos || []);
  };

  const loadAvailable = async () => {
    setLoadingAvailable(true);
    try {
      const res = await fetch("/api/repos/search");
      const data = await res.json() as { repos: string[] };
      setAvailable(data.repos || []);
    } catch {
      // fail silently
    }
    setLoadingAvailable(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadTracked();
      loadAvailable();
    }
  }, [isOpen]);

  const addRepo = async (repo: string) => {
    setSaving(true);
    await fetch("/api/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo }),
    });
    await loadTracked();
    setSaving(false);
  };

  const removeRepo = async (repo: string) => {
    await fetch("/api/repos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo }),
    });
    await loadTracked();
  };

  const handleAddManual = async () => {
    if (!manual.trim()) return;
    await addRepo(manual.trim());
    setManual("");
  };

  const handleClose = () => {
    onClose();
    onReposChange();
  };

  const untracked = available.filter((r) => !tracked.includes(r));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {() => (
          <>
            <ModalHeader>Manage Repositories</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-default-600 mb-2">
                    Tracked Repositories ({tracked.length})
                  </h3>
                  <div className="flex flex-wrap gap-2 min-h-8">
                    {tracked.length === 0 && (
                      <span className="text-default-400 text-sm">No repos tracked yet</span>
                    )}
                    {tracked.map((r) => (
                      <Chip
                        key={r}
                        onClose={() => removeRepo(r)}
                        variant="flat"
                        color="primary"
                      >
                        {r}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add repo manually (e.g. owner/repo)"
                    value={manual}
                    onValueChange={setManual}
                    size="sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
                  />
                  <Button
                    size="sm"
                    color="primary"
                    onPress={handleAddManual}
                    isLoading={saving}
                  >
                    Add
                  </Button>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-default-600 mb-2">
                    Your GitHub Repositories
                  </h3>
                  {loadingAvailable ? (
                    <div className="flex justify-center py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                      {untracked.map((r) => (
                        <div
                          key={r}
                          className="flex items-center justify-between px-3 py-2 bg-default-50 rounded-lg"
                        >
                          <span className="text-sm">{r}</span>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => addRepo(r)}
                          >
                            Track
                          </Button>
                        </div>
                      ))}
                      {untracked.length === 0 && (
                        <p className="text-default-400 text-sm text-center py-4">
                          All your repos are being tracked!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={handleClose}>
                Done
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
