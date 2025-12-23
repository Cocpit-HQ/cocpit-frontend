"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddSkillsFormProps {
  isDark?: boolean; // Optional
  onSave: (newSkills: string[]) => void;
  onCancel: () => void;
}

const AddSkillsForm: React.FC<AddSkillsFormProps> = ({ onSave, onCancel }) => {
  const [skillInput, setSkillInput] = useState<string>("");

  const inputStyles = "bg-input border-border text-foreground placeholder-muted-foreground";
  const labelStyles = "text-sm font-medium text-foreground";

  const handleAddSkills = () => {
    const skillsArray = skillInput
      .split(/[,;\n]/) // Split by comma, semicolon, or new line
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    onSave(skillsArray);
    setSkillInput(""); // Clear input after saving
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="skills" className={labelStyles}>
          Add Skills (comma, semicolon, or new-line separated)
        </Label>
        <Textarea
          id="skills"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          className={`${inputStyles} min-h-[150px] focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0`}
          placeholder="e.g., Product Strategy, User Research, Data Analysis"
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-border text-muted-foreground hover:bg-muted bg-transparent"
        >
          Cancel
        </Button>
        <Button
          onClick={handleAddSkills}
          className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white hover:opacity-90 transition-all"
        >
          Add Skills
        </Button>
      </div>
    </div>
  );
};

export default AddSkillsForm;
