"use client";

import { useState } from "react";
import ProfileStep from "./ProfileStep";
import BioStep from "./BioStep";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({
    profileImage: null as string | null,
    accountName: "",
    bio: "",
    phoneNumber: "",
  });

  const handleProfileComplete = (data: { profileImage: string | null; accountName: string }) => {
    setProfileData((prev) => ({
      ...prev,
      profileImage: data.profileImage,
      accountName: data.accountName,
    }));
    setCurrentStep(2);
  };

  const handleBioComplete = (data: { bio: string; phoneNumber: string }) => {
    setProfileData((prev) => ({
      ...prev,
      bio: data.bio,
      phoneNumber: data.phoneNumber,
    }));
    // For now, just log the data. In future, this will be sent to the database
    console.log("Onboarding completed:", {
      ...profileData,
      ...data,
    });
    // In future: redirect to dashboard or home page
    alert("Profile setup complete! (Static for now)");
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      {currentStep === 1 ? (
        <ProfileStep
          onComplete={handleProfileComplete}
          onBack={handleBack}
          currentStep={currentStep}
          initialData={{
            profileImage: profileData.profileImage,
            accountName: profileData.accountName,
          }}
        />
      ) : (
        <BioStep
          onComplete={handleBioComplete}
          onBack={handleBack}
          currentStep={currentStep}
          initialData={{
            bio: profileData.bio,
            phoneNumber: profileData.phoneNumber,
          }}
        />
      )}
    </>
  );
}
