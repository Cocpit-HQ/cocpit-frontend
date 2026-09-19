import { OnboardingFlow } from "@/features/onboarding";
import { FeatureGuard } from "@/components/feature-flags/FeatureGuard";

export default function OnboardingRoute() {
  return (
    <FeatureGuard featureKey="enableOnboardingModule" mode="fullPage">
      <OnboardingFlow />
    </FeatureGuard>
  );
}
