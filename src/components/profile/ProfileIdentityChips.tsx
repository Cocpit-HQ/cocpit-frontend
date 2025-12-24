"use client";

import React, { useState } from "react";
import { Edit2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProfileIdentity } from "@/types/profile";

interface ProfileIdentityChipsProps {
  initialIdentity: ProfileIdentity;
}

export function ProfileIdentityChips({ initialIdentity }: ProfileIdentityChipsProps) {
  const [identity, setIdentity] = useState<ProfileIdentity>(initialIdentity);
  const [isEditing, setIsEditing] = useState(false);
  const [tempIdentity, setTempIdentity] = useState<ProfileIdentity>(initialIdentity);

  const handleSave = () => {
    setIdentity(tempIdentity);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempIdentity(identity);
    setIsEditing(false);
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2 items-center">
      <div className="flex flex-wrap gap-2 flex-1">
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border border-primary/20">
          <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Open to:</span>
          {identity.openTo}
        </div>
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border border-green-500/20">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Availability:</span>
          {identity.availability}
        </div>
        <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border border-blue-500/20">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Preference:</span>
          {identity.workPreference}
        </div>
      </div>

      <button
        onClick={() => setIsEditing(true)}
        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
        aria-label="Edit professional identity"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      <Dialog open={isEditing} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Professional Identity</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Open to</label>
              <div className="flex flex-wrap gap-2">
                {(["Full-time", "Freelance", "Consulting", "Mentorship"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setTempIdentity({ ...tempIdentity, openTo: option })}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      tempIdentity.openTo === option
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Availability</label>
              <div className="flex flex-wrap gap-2">
                {(["Immediate", "30 Days", "Casual Networking"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setTempIdentity({ ...tempIdentity, availability: option })}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      tempIdentity.availability === option
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Work Preference</label>
              <div className="flex flex-wrap gap-2">
                {(["Remote", "Hybrid", "Onsite"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setTempIdentity({ ...tempIdentity, workPreference: option })}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      tempIdentity.workPreference === option
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
