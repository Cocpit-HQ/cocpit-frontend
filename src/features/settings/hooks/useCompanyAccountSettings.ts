"use client";

import { useState, useCallback } from "react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { toast } from "sonner";

interface CompanyAccountData {
  email: string;
  phone: string | null;
  isDeactivated: boolean;
  companyName: string;
  entityType: "COMPANY" | "INSTITUTION";
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock hook for company account settings.
 * TODO: Replace mock with real API calls when backend is ready:
 *   GET  /organizations/:orgId/account-settings
 *   PATCH /organizations/:orgId/deactivate
 *   PATCH /organizations/:orgId/reactivate
 *   DELETE /organizations/:orgId
 */
export function useCompanyAccountSettings() {
  const { activeProfile } = useActiveProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<CompanyAccountData>({
    email: "alex.jordan@cocpit.io",
    phone: "+91 4545445454",
    isDeactivated: false,
    companyName: activeProfile?.name || "Company",
    entityType: (activeProfile?.entityType as "COMPANY" | "INSTITUTION") || "COMPANY",
  });

  const entityLabel = data.entityType === "INSTITUTION" ? "institution" : "company";

  const deactivateCompany = useCallback(async () => {
    setIsLoading(true);
    await delay(500);
    setData((prev) => ({ ...prev, isDeactivated: true }));
    toast.success(`Your ${entityLabel} page has been deactivated`);
    setIsLoading(false);
  }, [entityLabel]);

  const reactivateCompany = useCallback(async () => {
    setIsLoading(true);
    await delay(500);
    setData((prev) => ({ ...prev, isDeactivated: false }));
    toast.success(`Your ${entityLabel} page has been reactivated`);
    setIsLoading(false);
  }, [entityLabel]);

  const deleteCompany = useCallback(async () => {
    setIsLoading(true);
    await delay(500);
    toast.success(`Your ${entityLabel} account has been deleted`);
    setIsLoading(false);
  }, [entityLabel]);

  return {
    data,
    isLoading,
    entityLabel,
    deactivateCompany,
    reactivateCompany,
    deleteCompany,
  };
}
