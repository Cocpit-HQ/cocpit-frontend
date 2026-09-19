"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/axios";

interface AppealModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

export function AppealModal({ isOpen, onOpenChange, postId }: AppealModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for your appeal.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/post/${postId}/appeal`, { reason });
      toast.success("Appeal submitted successfully. Our team will review it shortly.");
      onOpenChange(false);
      setReason("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit appeal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Appeal Post Removal</DialogTitle>
          <DialogDescription>
            If you believe your post was removed by mistake, you can submit an appeal. Please explain why this post does not violate our community guidelines.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Explain your reasoning here..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[120px]"
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Appeal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
