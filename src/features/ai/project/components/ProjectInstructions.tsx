"use client";
import React, { useState, useEffect, useRef } from "react";

interface ProjectInstructionsProps {
  instructions: string;
  onSave: (instructions: string) => void;
}

export default function ProjectInstructions({
  instructions,
  onSave,
}: ProjectInstructionsProps) {
  const [draftText, setDraftText] = useState(instructions);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync draft text when parent instructions change (e.g. on mount or project switch)
  useEffect(() => {
    setDraftText(instructions);
  }, [instructions]);

  const hasChanges = draftText !== instructions;

  const handleCancel = () => {
    setDraftText(instructions);
    setIsFocused(false);
    if (textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  const handleSave = () => {
    if (hasChanges) {
      onSave(draftText);
      setIsFocused(false);
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }
  };

  // Border style logic:
  // Show border only when focused, else none/transparent
  const borderStyle = isFocused
    ? "1px solid var(--primary)"
    : "1px solid transparent";
 
  const boxShadowStyle = isFocused
    ? "var(--card-shadow-inner)"
    : "none";
 
  const hasContent = draftText.trim().length > 0;
 
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "0px",
        gap: "10px",
        width: "100%",
        flex: 1,
        alignSelf: "stretch",
        boxSizing: "border-box",
        minHeight: 0,
      }}
    >
      {/* Section Title */}
      <h3
        style={{
          width: "auto",
          height: "20px",
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
          fontStyle: "normal",
          fontWeight: 400,
          fontSize: "14px",
          lineHeight: "20px",
          color: "var(--foreground)",
          alignSelf: "flex-start",
        }}
      >
        Set project instructions
      </h3>
 
      {/* Instruction Input Area Container */}
      <div
        onClick={() => textareaRef.current?.focus()}
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          padding: "16px",
          width: "100%",
          flex: 1,
          alignSelf: "stretch",
          background: "var(--background)",
          border: borderStyle,
          boxShadow: boxShadowStyle,
          borderRadius: "12px",
          transition: "all 0.2s ease-in-out",
          cursor: "text",
          minHeight: 0,
        }}
      >
        <textarea
          ref={textareaRef}
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Tell the AI how you'd like it to respond and what it should know about this project."
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            fontFamily: "'Poppins', sans-serif",
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: "12px",
            lineHeight: "16px",
            color: hasContent ? "var(--foreground)" : "var(--muted-foreground)",
            padding: 0,
            margin: 0,
            boxSizing: "border-box",
          }}
        />
      </div>
 
      {/* Bottom Action Buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "0px",
          gap: "16px",
          width: "100%",
          height: "40px",
          alignSelf: "stretch",
          marginTop: "6px",
          boxSizing: "border-box",
        }}
      >
        {/* Cancel Button */}
        <button
          type="button"
          onClick={handleCancel}
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            padding: "8px 16px",
            gap: "10px",
            width: "82px",
            height: "40px",
            background: "var(--background)",
            border: "1px solid var(--primary)",
            borderRadius: "24px",
            cursor: "pointer",
            outline: "none",
            transition: "all 0.2s ease",
          }}
          className="hover:opacity-90"
        >
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontStyle: "normal",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "20px",
              textAlign: "center",
              color: "var(--primary)",
            }}
          >
            Cancel
          </span>
        </button>
 
        {/* Save Button */}
        <button
          type="button"
          disabled={!hasChanges}
          onClick={handleSave}
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            padding: "8px 16px",
            gap: "10px",
            width: "67px",
            height: "40px",
            background: hasChanges ? "var(--primary)" : "var(--primary-tint)",
            border: "1px solid var(--border)",
            borderRadius: "24px",
            cursor: hasChanges ? "pointer" : "default",
            outline: "none",
            transition: "all 0.2s ease",
          }}
          className={hasChanges ? "hover:opacity-90" : ""}
        >
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontStyle: "normal",
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: "20px",
              textAlign: "center",
              color: hasChanges ? "var(--primary-foreground)" : "var(--muted-foreground)",
            }}
          >
            Save
          </span>
        </button>
      </div>
    </div>
  );
}
