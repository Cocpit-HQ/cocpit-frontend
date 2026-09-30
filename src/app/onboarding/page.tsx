import { Suspense } from "react";
import { OnboardingFlow } from "@/features/onboarding";
import { FeatureGuard } from "@/components/feature-flags/FeatureGuard";

export default function OnboardingRoute() {
  return (
    <FeatureGuard featureKey="enableOnboardingModule" mode="fullPage">
      <Suspense fallback={null}>
        <OnboardingFlow />
      </Suspense>
    </FeatureGuard>
  );
}
