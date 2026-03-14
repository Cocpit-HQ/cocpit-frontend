"use client";

import React from "react";

import { JobsProvider } from "@/context/JobsContext";

export default function JobsRouteLayout({ children }: { children: React.ReactNode }) {
  return <JobsProvider>{children}</JobsProvider>;
}
