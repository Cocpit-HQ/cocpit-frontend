import { Suspense } from "react";
import { CompanyOnboardingPage } from "@/features/company-onboarding";

export default function Route() {
  return (
    <Suspense fallback={null}>
      <CompanyOnboardingPage />
    </Suspense>
  );
}
