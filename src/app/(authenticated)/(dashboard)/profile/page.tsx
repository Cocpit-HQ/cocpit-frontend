import { ProfilePage } from "@/features/profile";
import { FeatureGuard } from "@/components/feature-flags";

export default function ProfileRoute() {
  return (
    <FeatureGuard featureKey="enableProfileTab" moduleName="User Profile">
      <ProfilePage />
    </FeatureGuard>
  );
}
