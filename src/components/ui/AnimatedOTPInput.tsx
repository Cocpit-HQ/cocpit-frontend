"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle } from "lucide-react";

type OTPStage =
  | "idle"
  | "verifying"
  | "merging"
  | "stoppie"
  | "landing"
  | "gap"
  | "ticking"
  | "blooming";

interface AnimatedOTPInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => Promise<boolean | void> | void;
  isError?: boolean;
  isSuccess?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  title?: string;
  subtitle?: string;
  successTitle?: string;
  successSubtitle?: string;
  onResend?: () => void;
  resendCountdown?: number;
  resendDisabled?: boolean;
  autoFocus?: boolean;
  verificationDelayMs?: number;
}

export function AnimatedOTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  isError = false,
  isSuccess = false,
  isLoading = false,
  disabled = false,
  errorMessage,
  title = "Verify deactivation code",
  subtitle = "Enter the verification code sent to your registered email.",
  successTitle = "Verified successfully",
  successSubtitle = "Your page has been verified.",
  onResend,
  resendCountdown = 0,
  resendDisabled = false,
  autoFocus = true,
  verificationDelayMs = 2500,
}: AnimatedOTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [stage, setStage] = useState<OTPStage>("idle");

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
    if (autoFocus && !disabled && !isLoading && stage === "idle") {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
        setFocusedIndex(0);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [length, autoFocus, disabled, stage]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  // Start sequential animation pipeline when 6th digit is entered
  const runVerificationSequence = async (val: string) => {
    setFocusedIndex(null);
    setStage("verifying");

    // Phase 1: Verifying with clockwise beam
    await new Promise((r) => setTimeout(r, verificationDelayMs || 2500));

    if (onComplete) {
      const result = await onComplete(val);
      if (result === false) {
        setStage("idle");
        return;
      }
    }

    // Phase 2: Slowly glide all boxes to the center (0.6 seconds)
    setStage("merging");
    await new Promise((r) => setTimeout(r, 650));

    // Phase 3: Left corner lifts up like bike rear wheel (0.45 seconds)
    setStage("stoppie");
    await new Promise((r) => setTimeout(r, 480));

    // Phase 4: Slowly come down to the ground (0.35 seconds)
    setStage("landing");
    await new Promise((r) => setTimeout(r, 380));

    // Phase 5: Half-second quiet gap on the ground (0.5 seconds)
    setStage("gap");
    await new Promise((r) => setTimeout(r, 500));

    // Phase 6: Manual visualization tick drawing (0.5 seconds)
    setStage("ticking");
    await new Promise((r) => setTimeout(r, 500));

    // Phase 7: Green gradient blooms outwards from box to popup boundary!
    setStage("blooming");
  };

  const handleDigitChange = (index: number, digitVal: string) => {
    if (stage !== "idle") return;

    const cleanDigit = digitVal.replace(/\D/g, "");
    if (!cleanDigit) {
      // Deleting
      const newDigits = [...digits];
      newDigits[index] = "";
      const newVal = newDigits.join("").trimEnd();
      onChange(newVal);
      return;
    }

    // Entering digit
    const lastChar = cleanDigit[cleanDigit.length - 1];
    const newDigits = [...digits];
    newDigits[index] = lastChar;
    const newVal = newDigits.join("");
    onChange(newVal);

    // Auto-advance focus to next digit box
    if (index < length - 1 && lastChar) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }

    // Trigger sequential verification pipeline
    if (newVal.length === length) {
      runVerificationSequence(newVal);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (stage !== "idle") return;
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const targetIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[targetIndex]?.focus();
      setFocusedIndex(targetIndex);

      if (pastedData.length === length) {
        runVerificationSequence(pastedData);
      }
    }
  };

  // Box dimensions & layout spacing
  const boxWidth = 50; // px
  const boxHeight = 56; // px
  const boxGap = 10; // px
  const centerIndex = (length - 1) / 2;
  const winnerIndex = Math.floor(centerIndex);

  const isMerged = [
    "merging",
    "stoppie",
    "landing",
    "gap",
    "ticking",
    "blooming",
  ].includes(stage);
  const isPostLanding = ["landing", "gap", "ticking", "blooming"].includes(
    stage
  );
  const isChecked = ["ticking", "blooming"].includes(stage);
  const isBlooming = stage === "blooming";

  return (
    <div className="relative flex flex-col items-center w-full select-none font-sans p-2 overflow-hidden">
      {/* ── STAGE 7: GREEN GRADIENT OUTWARD SPREAD TO POPUP BOUNDARY ── */}
      <AnimatePresence>
        {isBlooming && (
          <motion.div
            key="blooming-gradient"
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 2.2, opacity: 0.45 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.4),rgba(5,150,105,0.15),transparent_75%)] blur-2xl z-0"
          />
        )}
      </AnimatePresence>

      {/* Ambient background soft aura */}
      <div className="pointer-events-none absolute -inset-4 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1),transparent_70%)] blur-2xl z-0" />

      {/* ── HEADER TITLE & SUBTITLE TRANSITION ── */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center w-full px-2 mb-3 min-h-[64px] justify-center">
        <AnimatePresence mode="wait">
          {isChecked ? (
            <motion.div
              key="verified-header"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-[19px] font-semibold text-white leading-snug tracking-tight">
                {successTitle}
              </h2>
              <p className="text-[13px] font-normal text-zinc-400 mt-0.5 max-w-[320px]">
                {successSubtitle}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="input-header"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-[18px] font-medium text-white leading-snug">
                {title}
              </h2>
              <p className="text-[13px] font-normal text-zinc-400 mt-0.5 max-w-[320px]">
                {subtitle}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── OTP BOXES CONTAINER WITH STEP-BY-STEP PHYSICS ── */}
      <div className="relative z-10 flex items-center justify-center my-2 h-[76px]">
        {/* Error Shake Wrapper */}
        <motion.div
          animate={isError ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="flex items-center justify-center gap-[10px]"
        >
          {Array.from({ length }).map((_, index) => {
            const char = digits[index];
            const isFilled = Boolean(char);
            const isFocused =
              focusedIndex === index && stage === "idle" && !isMerged;

            // Target X position when merging into the center
            const targetX = isMerged
              ? (centerIndex - index) * (boxWidth + boxGap)
              : 0;
            const isWinnerBox = index === winnerIndex;

            // Transform parameters for Bike Stoppie sequence
            let rotateAngle = 0;
            let yOffset = 0;
            let scaleXVal = 1;
            let scaleYVal = 1;

            if (isMerged && isWinnerBox) {
              if (stage === "stoppie") {
                // Rear/Left corner goes UP into the air
                rotateAngle = -22;
                yOffset = -16;
                scaleXVal = 1.06;
                scaleYVal = 1.06;
              } else if (isPostLanding) {
                // Settled smoothly on ground
                rotateAngle = 0;
                yOffset = 0;
                scaleXVal = 1;
                scaleYVal = 1;
              }
            }

            return (
              <motion.div
                key={index}
                animate={{
                  x: targetX,
                  y: yOffset,
                  rotate: rotateAngle,
                  scaleX: isMerged ? (isWinnerBox ? scaleXVal : 0) : isFocused ? 1.05 : 1,
                  scaleY: isMerged ? (isWinnerBox ? scaleYVal : 0) : isFocused ? 1.05 : 1,
                  opacity: isMerged ? (isWinnerBox ? 1 : 0) : 1,
                }}
                transition={{
                  x: { duration: 0.6, ease: [0.25, 1, 0.5, 1] }, // Slow smooth inward glide from both sides!
                  y: { duration: 0.4, ease: "easeOut" },
                  rotate: { duration: 0.45, ease: "easeOut" },
                  scaleX: { duration: 0.35 },
                  scaleY: { duration: 0.35 },
                  opacity: { duration: 0.3 },
                }}
                style={{
                  width: `${boxWidth}px`,
                  height: `${boxHeight}px`,
                  transformOrigin: "bottom right", // Front wheel on right, left rear corner lifts into the air!
                }}
                className={`relative flex items-center justify-center rounded-2xl p-[2px] transition-colors duration-400 ${
                  isWinnerBox && isChecked
                    ? "bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[0_0_35px_rgba(16,185,129,0.7)] border-2 border-emerald-300"
                    : isWinnerBox && isPostLanding
                    ? "bg-zinc-800 border-2 border-zinc-500 shadow-md"
                    : isError
                    ? "bg-red-950/30 border-2 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                    : isFocused
                    ? "bg-zinc-900 border-2 border-indigo-500 shadow-[0_0_18px_rgba(99,102,241,0.45)]"
                    : isFilled
                    ? "bg-zinc-800/90 border-2 border-zinc-600/80 shadow-sm"
                    : "bg-zinc-900/90 border-2 border-zinc-700/60 hover:border-zinc-500"
                }`}
              >
                {/* ── CLOCKWISE PERIMETER BEAM (ACTIVE DURING VERIFYING STAGE) ── */}
                {stage === "verifying" && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl overflow-visible z-20">
                    <motion.rect
                      x="1"
                      y="1"
                      width={boxWidth - 2}
                      height={boxHeight - 2}
                      rx="14"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0.35, pathOffset: 0 }}
                      animate={{ pathOffset: [0, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        ease: "linear",
                      }}
                      style={{
                        filter: "drop-shadow(0 0 6px rgba(129, 140, 248, 0.85))",
                      }}
                    />
                  </svg>
                )}

                {/* Inner Slot Body */}
                <div
                  className={`relative z-10 w-full h-full rounded-[14px] flex items-center justify-center transition-colors duration-400 ${
                    isWinnerBox && isChecked
                      ? "bg-gradient-to-b from-emerald-500 to-emerald-600"
                      : isFilled
                      ? "bg-zinc-900/95"
                      : isFocused
                      ? "bg-zinc-900"
                      : "bg-zinc-950/90"
                  }`}
                >
                  {/* Regular Input & Scaled Digit */}
                  {(!isMerged || !isWinnerBox || !isChecked) && (
                    <>
                      <input
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={char}
                        disabled={disabled || stage !== "idle"}
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() => setFocusedIndex(null)}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-full h-full text-center font-bold text-xl bg-transparent text-white outline-none select-none"
                      />

                      {/* Scale-in typed digit animation */}
                      <AnimatePresence>
                        {isFilled && (
                          <motion.span
                            initial={{ scale: 0.3, opacity: 0, y: -4 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.3, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 22 }}
                            className="pointer-events-none absolute inset-0 flex items-center justify-center font-bold text-xl text-white bg-zinc-900/95 rounded-[14px]"
                          >
                            {char}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {/* ── WINNER CENTER BOX SVG MANUAL TICK DRAWING ── */}
                  {isWinnerBox && isChecked && (
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center text-white"
                    >
                      <svg
                        className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <motion.path
                          d="M5 13l4 4L19 7"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{
                            pathLength: { duration: 0.45, ease: "easeOut" },
                            opacity: { duration: 0.1 },
                          }}
                        />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── ERROR MESSAGE ── */}
      {errorMessage && stage === "idle" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1.5"
        >
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* ── FOOTER: RESEND CODE ROW ── */}
      {onResend && (
        <div className="relative z-10 w-full flex justify-center items-center mt-3 pt-1">
          <p className="text-[13px] text-zinc-400 flex items-center gap-1.5">
            <span>Didn't receive the code?</span>
            <button
              type="button"
              onClick={onResend}
              disabled={resendCountdown > 0 || resendDisabled || stage !== "idle"}
              className={`font-medium transition-colors ${
                resendCountdown > 0 || resendDisabled || stage !== "idle"
                  ? "text-zinc-600 cursor-not-allowed"
                  : "text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
              }`}
            >
              {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : "Resend"}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
