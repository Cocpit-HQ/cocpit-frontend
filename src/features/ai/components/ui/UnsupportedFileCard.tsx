import React from "react";
import { Icon } from "@iconify/react";

interface UnsupportedFileCardProps {
  fileName: string;
  fileType: string;
  isUnsupported?: boolean;
  isTooLarge?: boolean;
  onRemove?: () => void;
  style?: React.CSSProperties;
}

export default function UnsupportedFileCard({
  fileName,
  fileType,
  isUnsupported = true,
  isTooLarge = false,
  onRemove,
  style,
}: UnsupportedFileCardProps) {
  const isSizeError = isTooLarge;
  
  const borderColor = isSizeError ? "var(--border)" : "var(--destructive)";
  const fileNameColor = isSizeError ? "var(--foreground)" : "var(--destructive)";
  const descText = isSizeError ? "Exceeds 25MB limit" : "Unsupported file format";
  const descFontSize = isSizeError ? "12px" : "14px";
  const descLineHeight = isSizeError ? "16px" : "20px";
  const closeIconColor = isSizeError ? "var(--muted-foreground)" : "var(--destructive)";

  return (
    <div
      style={{
        boxSizing: "border-box",
        position: "relative",
        width: "204px",
        height: "56px",
        background: "var(--background)",
        border: `1px solid ${borderColor}`,
        borderRadius: "12px",
        flex: "none",
        flexGrow: 0,
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0px",
          gap: "8px",
          position: "absolute",
          width: "calc(100% - 37px)",
          height: "40px",
          left: "8px",
          top: "8px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontFamily: "'Poppins'",
              fontStyle: "normal",
              fontWeight: 600,
              fontSize: "14px",
              lineHeight: "20px",
              textAlign: "left",
              color: fileNameColor,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
            }}
            title={fileName}
          >
            {fileName}
          </span>
          <span
            style={{
              fontFamily: "'Poppins'",
              fontStyle: "normal",
              fontWeight: 400,
              fontSize: descFontSize,
              lineHeight: descLineHeight,
              textAlign: "left",
              color: "var(--destructive)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
            }}
          >
            {descText}
          </span>
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            position: "absolute",
            width: "24px",
            height: "24px",
            top: "4px",
            right: "4px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0px",
          }}
          title="Remove file"
        >
          <Icon icon="ri:close-line" width={16} height={16} style={{ color: closeIconColor }} />
        </button>
      )}
    </div>
  );
}
