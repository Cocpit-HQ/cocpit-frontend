"use client";

import React from 'react';
import { Loader2, BadgeCheck, AlertTriangle } from 'lucide-react';
import { useCompanyPrivacySettings } from '../../hooks/useCompanyPrivacySettings';
import { PrivacySettings } from '@/services/api/settings';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { VerifyIdentityModal } from '../privacy/components/modals/VerifyIdentityModal';

export function CompanyPrivacySettingsPage() {
  const { settings: privacy, isLoading, updateSettings } = useCompanyPrivacySettings();
  const { activeProfile } = useActiveProfile();
  const [isVerifyModalOpen, setIsVerifyModalOpen] = React.useState(false);

  const showEmail = privacy?.showEmail ?? false;
  const showPhone = privacy?.showPhone ?? false;

  const ToggleItem = ({ title, subtitle, state, setter }: { title: string, subtitle?: string, state: boolean, setter: (val: boolean) => void }) => (
    <div className="flex flex-row items-center justify-between py-[12px] w-full min-h-[68px]">
      <div className="flex flex-col justify-center">
        <span className="text-[16px] font-normal text-black dark:text-company-text leading-[24px]">{title}</span>
        {subtitle && <span className="text-[14px] font-normal text-[#6B7280] dark:text-company-secondary leading-[20px]">{subtitle}</span>}
      </div>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setter(!state)}
        className={`relative w-[44px] h-[24px] rounded-full transition-colors focus:outline-none flex-shrink-0 ${
          state ? 'bg-[#1A73E8]' : 'bg-gray-200'
        }`}
      >
        <span className={`absolute top-[2px] bg-white dark:bg-company-card w-[20px] h-[20px] rounded-full transition-all ${
          state ? 'left-[22px]' : 'left-[2px]'
        }`} />
      </button>
    </div>
  );

  const RadioGroup = ({
    title,
    description,
    options,
    value,
    settingKey
  }: {
    title: string;
    description?: string;
    options: { id: string; label: string }[];
    value: string;
    settingKey: keyof PrivacySettings;
  }) => (
    <div className="flex flex-col w-full gap-2">
      <div className="flex flex-col w-full mb-2">
        <h2 className="text-[18px] font-medium text-black dark:text-company-text leading-[26px]">{title}</h2>
        {description && <p className="text-[14px] font-normal text-[#6B7280] dark:text-company-secondary leading-[20px]">{description}</p>}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 text-[#1A73E8] dark:text-company-primary animate-spin" />
        </div>
      ) : (
      <div className="flex flex-col w-full">
        {options.map(option => {
          const isSelected = value === option.id;
          return (
            <div 
              key={option.id} 
              onClick={() => updateSettings({ [settingKey]: option.id as any })}
              className="flex flex-row items-center justify-between p-4 -mx-4 rounded-[12px] cursor-pointer transition-colors"
            >
              <span className="text-[16px] font-normal text-black dark:text-company-text leading-[24px]">{option.label}</span>
              {/* Custom Radio */}
              <div 
                className={`flex items-center justify-center rounded-full border-[2px] transition-all ${
                  isSelected 
                    ? 'w-[24px] h-[24px] border-[#1A73E8] dark:border-company-primary' 
                    : 'w-[20px] h-[20px] border-[#6B7280] mr-[2px]'
                }`}
              >
                {isSelected && (
                  <div className="w-[12px] h-[12px] rounded-full bg-[#1A73E8]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20 relative">
      <div className="flex flex-col items-start px-[36px] py-[24px] gap-[24px] w-full border-b border-[#EEF2FF]">
        <div className="flex flex-col items-start p-0 gap-2 w-[466px]">
          <h1 className="text-[24px] font-semibold text-black dark:text-company-text leading-[32px] tracking-tight m-0 p-0">Privacy</h1>
          <p className="text-[14px] font-normal text-[#6B7280] dark:text-company-secondary leading-[20px] m-0 p-0">Control how you share your information and manage device access.</p>
        </div>
      </div>

      <div className="flex flex-col w-full px-[36px] py-4 gap-4">
        


        {/* Content */}
        <div className="flex flex-col w-full gap-4 max-w-[698px]">
          
          {/* Profile Visibility */}
          <div className="flex flex-col w-full gap-2">
            <h2 className="text-[18px] font-medium text-black dark:text-company-text leading-[26px]">Profile visibility</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-[#1A73E8] dark:text-company-primary animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col w-full">
                <ToggleItem 
                  title="Show email on profile" 
                  subtitle="Let other see your email on your public profile"
                  state={showEmail} 
                  setter={(val) => updateSettings({ showEmail: val })} 
                />
                <div className="w-full border-t border-[#EEF2FF]" />
                <ToggleItem 
                  title="Show phone number on profile" 
                  subtitle="Let other see your Phone number on your public profile"
                  state={showPhone} 
                  setter={(val) => updateSettings({ showPhone: val })} 
                />
                <div className="w-full border-t border-[#EEF2FF]" />
                <div className="flex flex-row items-center justify-between py-[16px] w-full min-h-[78px]">
                  <div className="flex flex-col justify-center">
                    <span className="flex-none order-none w-[182px] h-[26px] font-medium text-[18px] leading-[26px] flex items-center text-black dark:text-company-text">
                      Account verification
                    </span>
                    <span className="flex-none order-1 w-[301px] h-[20px] font-normal text-[14px] leading-[20px] flex items-center text-[#6B7280] dark:text-company-secondary">
                      {activeProfile?.verification_status === 'VERIFIED' 
                        ? "Your identity has been verified"
                        : "Verify your identity to unlock more features"}
                    </span>
                  </div>
                  {activeProfile?.verification_status === 'VERIFIED' ? (
                    <div className="flex flex-row items-center justify-center gap-1.5 px-3 py-1.5 bg-[#ECFDF5] text-[#10B981] rounded-full">
                      <BadgeCheck className="w-4 h-4" strokeWidth={2} />
                      <span className="text-[14px] font-medium">Verified</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsVerifyModalOpen(true)}
                      className="flex items-center justify-center w-[140px] h-[40px] bg-white border border-[#818CF8] text-[#818CF8] rounded-[24px] text-[14px] font-medium hover:bg-[#818CF8]/5 transition-colors"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full border-t border-[#EEF2FF]" />

          {/* Who Can Tag You */}
          <RadioGroup
            title="Who can tag you"
            description="Control who is allowed to tag you across COCPIT"
            options={[
              { id: 'everyone', label: 'Everyone' },
              { id: 'followers_only', label: 'Followers only' },
              { id: 'no_one', label: 'No One' }
            ]}
            value={privacy?.tagPermission || 'everyone'}
            settingKey="tagPermission"
          />

          <div className="w-full border-t border-[#EEF2FF]" />

          {/* Who can see your following */}
          <RadioGroup
            title="Who can see your following"
            description="Control who is allowed to see your following"
            options={[
              { id: 'everyone', label: 'Everyone' },
              { id: 'followers_only', label: 'Followers only' },
              { id: 'no_one', label: 'No One' }
            ]}
            value={privacy?.followingVisibility || 'everyone'}
            settingKey="followingVisibility"
          />

          <div className="w-full border-t border-[#EEF2FF]" />

          {/* Who can see your followers */}
          <RadioGroup
            title="Who can see your followers"
            description="Control who is allowed to see your followers"
            options={[
              { id: 'everyone', label: 'Everyone' },
              { id: 'followers_only', label: 'Followers only' },
              { id: 'no_one', label: 'No One' }
            ]}
            value={privacy?.followersVisibility || 'everyone'}
            settingKey="followersVisibility"
          />

          <div className="w-full border-t border-[#EEF2FF]" />

          {/* Who can message you */}
          <RadioGroup
            title="Who can message you"
            description="Control who can send direct messages to your company"
            options={[
              { id: 'everyone', label: 'Everyone' },
              { id: 'followers_only', label: 'Followers only' },
              { id: 'no_one', label: 'No one' }
            ]}
            value={privacy?.messagePermission || 'everyone'}
            settingKey="messagePermission"
          />

        </div>

      </div>
      <VerifyIdentityModal 
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </div>
  );
}
