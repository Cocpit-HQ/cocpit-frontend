"use client";

import { isAxiosError } from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, ScanLine, ShieldAlert, ShieldCheck } from "lucide-react";
import { validateEventTicket, getEventById } from "@/services/api/event";
import type { Html5Qrcode } from "html5-qrcode";

type ScanTone = "idle" | "processing" | "success" | "error";

interface ScanStatus {
  tone: ScanTone;
  message: string;
}

const getStatusClasses = (tone: ScanTone) => {
  switch (tone) {
    case "success":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "error":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
    case "processing":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    default:
      return "border-border bg-card text-muted-foreground";
  }
};

export default function EventScanPage() {
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);
  const lastDecodedRef = useRef<string | null>(null);

  const [status, setStatus] = useState<ScanStatus>({
    tone: "idle",
    message: "Point the camera at an event ticket QR code.",
  });
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [currentEventName, setCurrentEventName] = useState<string>("Loading event...");
  const [lastRawData, setLastRawData] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    // Fetch current event name
    const fetchEvent = async () => {
      try {
        const event = await getEventById(eventId);
        if (!cancelled && event) {
          setCurrentEventName(event.title);
        }
      } catch (err) {
        if (!cancelled) setCurrentEventName("Event Check-In");
      }
    };
    void fetchEvent();

    const mountScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode("ticket-qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText: string) => {
            if (isProcessingRef.current || decodedText === lastDecodedRef.current) {
              return;
            }

            isProcessingRef.current = true;
            lastDecodedRef.current = decodedText;
            setLastRawData(decodedText);
            setStatus({ tone: "processing", message: "Validating ticket..." });

            try {
              const parsed = JSON.parse(decodedText);
              const ticketId = typeof parsed?.ticketId === "string" ? parsed.ticketId : "";
              const scannedEventId = typeof parsed?.eventId === "string" ? parsed.eventId : undefined;

              if (!ticketId) {
                throw new Error("Invalid QR");
              }

              const result = await validateEventTicket(eventId, {
                ticketId,
                eventId: scannedEventId,
              });

              setStatus({
                tone: "success",
                message: result.message,
              });
            } catch (error: unknown) {
              const message = isAxiosError(error)
                ? error.response?.data?.message || "Ticket validation failed"
                : error instanceof Error
                  ? error.message
                  : "Invalid QR";
              setStatus({
                tone: "error",
                message,
              });
            } finally {
              if (cooldownRef.current) clearTimeout(cooldownRef.current);
              cooldownRef.current = setTimeout(() => {
                isProcessingRef.current = false;
                lastDecodedRef.current = null;
              }, 1800);
            }
          },
          () => null
        );

        if (!cancelled) {
          setIsScannerReady(true);
          setStatus({
            tone: "idle",
            message: "Scanner ready. A valid ticket will be checked in immediately.",
          });
        }
      } catch (error) {
        console.error("Failed to start scanner", error);
        if (!cancelled) {
          setStatus({
            tone: "error",
            message: "Camera access failed. Check permissions and try again.",
          });
        }
      }
    };

    void mountScanner();

    return () => {
      cancelled = true;
      if (cooldownRef.current) clearTimeout(cooldownRef.current);

      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner) {
        // Defensive: some versions of html5-qrcode might return undefined or a non-promise
        Promise.resolve(scanner.stop())
          .catch(() => null)
          .finally(() => {
            if (typeof scanner.clear === "function") {
              Promise.resolve(scanner.clear()).catch(() => null);
            }
          });
      }
    };
  }, [eventId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Organizer scanner</p>
            <h1 className="text-3xl font-bold truncate max-w-[200px] sm:max-w-md" title={currentEventName}>
              {currentEventName}
            </h1>
          </div>
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Event</span>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <ScanLine className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Live scanner</p>
                  <p className="text-sm text-muted-foreground">
                    {isScannerReady ? "Camera is active" : "Starting camera"}
                  </p>
                </div>
              </div>
              {!isScannerReady && (
                <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>

            <div
              id="ticket-qr-reader"
              className="min-h-[320px] overflow-hidden rounded-2xl border border-dashed border-border bg-black/5"
            />
          </div>

          <div className="space-y-4">
            <div className={`rounded-2xl border p-4 ${getStatusClasses(status.tone)}`}>
              <div className="mb-3 flex items-center gap-2">
                {status.tone === "success" ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : status.tone === "error" ? (
                  <ShieldAlert className="h-5 w-5" />
                ) : status.tone === "processing" ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <ScanLine className="h-5 w-5" />
                )}
                <p className="font-semibold">Scan status</p>
              </div>
              <p className="text-sm">{status.message}</p>
            </div>

            {status.tone === "error" && lastRawData && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-500/70">Raw Scanned Data</p>
                <code className="block break-all text-[10px] text-muted-foreground font-mono bg-black/20 p-2 rounded">
                  {lastRawData}
                </code>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-sm font-semibold">Validation rules</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Only tickets for this event are accepted.</li>
                <li>A successful scan marks the ticket as checked in.</li>
                <li>Scanning the same ticket again will be rejected.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
