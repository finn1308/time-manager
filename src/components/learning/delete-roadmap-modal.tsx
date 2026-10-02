"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteRoadmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmapTitle: string;
  roadmapId: string;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export function DeleteRoadmapModal({
  open,
  onOpenChange,
  roadmapTitle,
  roadmapId,
  onSuccess,
  onError,
}: DeleteRoadmapModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/learning/roadmaps/${roadmapId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to delete this roadmap. Please try again.");
      }

      onOpenChange(false);
      onSuccess(data.message || "Learning roadmap deleted successfully.");
    } catch (err: any) {
      onError(err.message || "Unable to delete this roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => !loading && onOpenChange(false)} className="max-w-md p-6 sm:p-7 space-y-5">
        {/* Header with Danger Badge */}
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] dark:bg-[#3d1a1a] text-[#dc2626] dark:text-[#f87171] flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#192e22] dark:text-[#f0f7f2]">
              Delete this learning roadmap?
            </h3>
            <p className="text-xs text-[#526b5c] dark:text-[#8aa693] mt-0.5 line-clamp-1">
              &quot;{roadmapTitle}&quot;
            </p>
          </div>
        </div>

        {/* Warning Bullet List (User Explicit Spec) */}
        <div className="p-4 rounded-2xl bg-[#fef2f2] dark:bg-[#2b1616] border border-[#fecaca] dark:border-[#522222] space-y-2.5">
          <p className="text-xs font-bold text-[#991b1b] dark:text-[#fca5a5]">
            This will permanently delete:
          </p>
          <ul className="text-xs space-y-1 text-[#7f1d1d] dark:text-[#fecaca] pl-5 list-disc font-medium">
            <li>Course & Roadmap structure</li>
            <li>Chapters & Stages</li>
            <li>Lessons & Topics</li>
            <li>Quizzes & Quiz questions</li>
            <li>Flashcards & Flashcard decks</li>
            <li>Learning progress & Quiz attempts</li>
            <li>Study sessions liên quan</li>
            <li>AI-generated content liên quan</li>
          </ul>
        </div>

        <p className="text-xs font-extrabold text-[#dc2626] dark:text-[#f87171] flex items-center space-x-1.5">
          <span>⚠️</span>
          <span>This action cannot be undone.</span>
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs px-5 border-[#dbe7dd] dark:border-[#263d2e] cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-full text-xs px-5 font-bold space-x-1.5 shadow-sm cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>{loading ? "Deleting..." : "Delete permanently"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
