"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DownloadProfileScreen } from "@/features/profile/components/download-profile";

export default function DownloadProfilePage() {
  const router = useRouter();

  return (
    <DownloadProfileScreen
      isOpen={true}
      onClose={() => router.push("/profile")}
    />
  );
}
