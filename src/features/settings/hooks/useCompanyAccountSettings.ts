"use client";

import { useQuery } from "@tanstack/react-query";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { companyService } from "@/services/organization.service";

interface CompanyAccountData {
  email: string;
  phone: string | null;
  isDeactivated: boolean;
  companyName: string;
  entityType: "COMPANY" | "INSTITUTION";
}

export function useCompanyAccountSettings() {
  const { activeProfile, isCompany } = useActiveProfile();

  const companyId = activeProfile?.id;
  const entityType = (activeProfile?.entityType as "COMPANY" | "INSTITUTION") || "COMPANY";
  const entityLabel = entityType === "INSTITUTION" ? "institution" : "company";

  const { data: rawData, isLoading, isError, refetch } = useQuery({
    queryKey: ['companyAccountSettings', companyId],
    queryFn: () => companyService.getAccountSettings(companyId!),
    enabled: isCompany && !!companyId,
    retry: 1
  });

  const data: CompanyAccountData = {
    email: rawData?.email || '',
    phone: rawData?.phone || null,
    isDeactivated: rawData?.isDeactivated || false,
    companyName: activeProfile?.name || "Company",
    entityType,
  };

  return {
    data,
    isLoading,
    isError,
    entityLabel,
    refetch,
  };
}

