export { default as BusinessProfilePage } from "./pages/BusinessProfilePage";
export { default as BusinessProfileEditPage } from "./pages/BusinessProfileEditPage";
export { default as BusinessVerificationPage } from "./pages/BusinessVerificationPage";
export { default as BusinessProfileHeader } from "./components/BusinessProfileHeader";
export { default as BusinessProfileTabs } from "./components/BusinessProfileTabs";
export { OrganizationStatsModal } from "./components/OrganizationStatsModal";
export * from "./types/business-profile.types";
export * from "./services/businessProfile.service";
export * from "./hooks/useBusinessPermissions";
export * from "./store/useBusinessEditStore";

// Backward-compatible aliases
export { default as CompanyProfilePage } from "./pages/BusinessProfilePage";
export { default as CompanyProfileEditPage } from "./pages/BusinessProfileEditPage";
export { default as CompanyProfileHeader } from "./components/BusinessProfileHeader";
export { default as CompanyProfileTabs } from "./components/BusinessProfileTabs";
