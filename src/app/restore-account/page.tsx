"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { restoreAccount } from "@/services/api/user";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "used" | "expired" | "invalid";

function RestoreAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("Invalid restoration link. No token found.");
      return;
    }

    restoreAccount(token)
      .then(() => {
        setStatus("success");
        setMessage("Your account has been restored! You can now log in.");
      })
      .catch((err) => {
        const msg: string = err?.response?.data?.message || err?.message || "Something went wrong.";
        if (msg.includes("already been used")) {
          setStatus("used");
        } else if (msg.includes("expired")) {
          setStatus("expired");
        } else {
          setStatus("invalid");
        }
        setMessage(msg);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-lg text-center space-y-6">
        {/* Logo */}
        <div className="text-2xl font-bold tracking-tight text-foreground">Cocpit</div>

        {/* Status Icon */}
        {status === "loading" && (
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        )}
        {status === "success" && (
          <div className="flex justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        )}
        {(status === "used" || status === "expired" || status === "invalid") && (
          <div className="flex justify-center">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
        )}

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            {status === "loading" && "Restoring your account..."}
            {status === "success" && "Account Restored!"}
            {status === "used" && "Link Already Used"}
            {status === "expired" && "Link Expired"}
            {status === "invalid" && "Invalid Link"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {status === "loading" && "Please wait while we verify your restoration link."}
            {status === "success" && message}
            {status === "used" && "This restoration link has already been used. Your account is already active."}
            {status === "expired" &&
              "This restoration link has expired. Please visit the login page to request a new one."}
            {status === "invalid" && (message || "This link is not valid. Please request a new one.")}
          </p>
        </div>

        {/* Actions */}
        {status === "success" && (
          <Button className="w-full" onClick={() => router.push("/")}>
            Go to Login
          </Button>
        )}
        {(status === "used") && (
          <Button className="w-full" onClick={() => router.push("/")}>
            Go to Login
          </Button>
        )}
        {(status === "expired" || status === "invalid") && (
          <div className="space-y-3">
            <Button className="w-full" onClick={() => router.push("/")}>
              Go to Login & Resend Email
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RestoreAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>}>
      <RestoreAccountContent />
    </Suspense>
  );
}
