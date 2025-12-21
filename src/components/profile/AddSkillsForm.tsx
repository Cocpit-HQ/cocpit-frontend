"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddSkillsFormProps {
  isDark: boolean;
  onSave: (newSkills: string[]) => void;
  onCancel: () => void;
}

const AddSkillsForm: React.FC<AddSkillsFormProps> = ({ isDark, onSave, onCancel }) => {
  const [skillInput, setSkillInput] = useState<string>("");

  const inputStyles = isDark
    ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-500"
    : "bg-[#0b1020]/5 border-gray-300 text-gray-900 placeholder-gray-500";
  const labelStyles = `text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`;

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
          className={
            isDark
              ? "border-[#2d3548] text-gray-300 hover:bg-[#171c28] bg-transparent"
              : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
          }
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
