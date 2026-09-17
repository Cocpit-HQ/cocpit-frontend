"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProfileEditScreen } from "@/features/profile/components/profile-edit";

export default function EditProfilePage() {
  const router = useRouter();

  return (
    <ProfileEditScreen
      isOpen={true}
      onClose={() => router.push("/profile")}
    />
  );
}
