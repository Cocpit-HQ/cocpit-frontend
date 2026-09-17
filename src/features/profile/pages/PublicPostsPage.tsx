"use client";

import React from "react";
import { ProfileAllPostsScreen } from "../components/ProfileAllPostsScreen";

interface PublicPostsPageProps {
  userId: string;
}

export default function PublicPostsPage({ userId }: PublicPostsPageProps) {
  return <ProfileAllPostsScreen userId={userId} />;
}
