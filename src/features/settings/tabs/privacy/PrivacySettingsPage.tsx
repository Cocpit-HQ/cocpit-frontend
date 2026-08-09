"use client";

import React from 'react';
import { Laptop, Smartphone, LogOut, Loader2, BadgeCheck, AlertTriangle } from 'lucide-react';
import { LogoutModal } from '../account/components/modals/LogoutModal';
import { usePrivacySettings } from '../../hooks/usePrivacySettings';
import { useMyProfile } from '@/hooks/use-my-profile';
import { VerifyIdentityModal } from './components/modals/VerifyIdentityModal';
import { useActiveSessions } from '../../hooks/useActiveSessions';
import { formatDistanceToNow } from 'date-fns';
import { useSettingsStore } from '@/store/settings.store';

export function PrivacySettingsPage() {
  const { settings: privacy, isLoading: isPrivacyLoading, updateSettings } = usePrivacySettings();
  const { sessions, isLoading: isSessionsLoading, logoutSession, logoutOtherSessions, isLoggingOut, isLoggingOutOthers } = useActiveSessions();
  const { data: myProfile, isLoading: isProfileLoading } = useMyProfile();
  const [isVerifyModalOpen, setIsVerifyModalOpen] = React.useState(false);

  // UI-only state (which logout confirmation is open, for which session)
  // now lives in the shared settings store instead of local useState.
  const logoutTarget = useSettingsStore((state) => state.privacy.logoutTarget);
  const sessionToLogout = useSettingsStore((state) => state.privacy.sessionToLogout);
  const openPrivacyLogout = useSettingsStore((state) => state.openPrivacyLogout);
  const closePrivacyLogout = useSettingsStore((state) => state.closePrivacyLogout);

  const showEmail = privacy?.showEmail ?? false;
  const showPhone = privacy?.showPhone ?? false;
  const tagPermission = privacy?.tagPermission ?? 'everyone';

  const ToggleItem = ({ title, subtitle, state, setter }: { title: string, subtitle: string, state: boolean, setter: (val: boolean) => void }) => (
    <div className="flex flex-row items-center justify-between py-[12px] w-full min-h-[68px]">
      <div className="flex flex-col justify-center">
        <span className="text-[16px] font-normal text-black leading-[24px]">{title}</span>
        <span className="text-[14px] font-normal text-[#6B7280] leading-[20px]">{subtitle}</span>
      </div>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setter(!state)}
        className={`relative w-[44px] h-[24px] rounded-full transition-colors focus:outline-none flex-shrink-0 ${
          state ? 'bg-[#6366F1]' : 'bg-gray-200'
        }`}
      >
        <span className={`absolute top-[2px] bg-white w-[20px] h-[20px] rounded-full transition-all ${
          state ? 'left-[22px]' : 'left-[2px]'
        }`} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-8 max-w-[698px]">
        
        {/* Header */}
        <div className="flex flex-col w-full h-[56px] justify-between">
          <h1 className="text-[24px] font-semibold text-black leading-[32px]">Privacy & security</h1>
          <p className="text-[16px] font-normal text-[#6B7280] leading-[24px]">Control how you share your information and manage device access.</p>
        </div>


        {/* Profile Visibility */}
        <div className="flex flex-col w-full gap-2">
          <h2 className="text-[18px] font-medium text-black leading-[26px]">Profile visibility</h2>
          
          {isPrivacyLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col w-full">
            <ToggleItem 
              title="Show email on profile" 
              subtitle="Let other see your email on your public profile" 
              state={showEmail} 
              setter={(val) => updateSettings({ showEmail: val })} 
            />
            <div className="w-full border-t border-[#DADADA]" />
            <ToggleItem 
              title="Show phone number on profile" 
              subtitle="Let other see your Phone number on your public profile" 
              state={showPhone} 
              setter={(val) => updateSettings({ showPhone: val })} 
            />
            <div className="w-full border-t border-[#DADADA]" />
            <div className="flex flex-row items-center justify-between py-[16px] w-full min-h-[78px]">
              <div className="flex flex-col justify-center">
                <span className="flex-none order-none w-[182px] h-[26px] font-medium text-[18px] leading-[26px] flex items-center text-black">
                  Account verification
                </span>
                <span className="flex-none order-1 w-[301px] h-[20px] font-normal text-[14px] leading-[20px] flex items-center text-[#6B7280]">
                  {myProfile?.user?.is_identity_verified 
                    ? "Your identity has been verified"
                    : "Verify your identity to unlock more features"}
                </span>
              </div>
              {myProfile?.user?.is_identity_verified ? (
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

        {/* Who Can Tag You */}
        <div className="flex flex-col w-full gap-2">
          <div className="flex flex-col w-full mb-2">
            <h2 className="text-[18px] font-medium text-black leading-[26px]">Who Can Tag You</h2>
            <p className="text-[14px] font-normal text-[#6B7280] leading-[20px]">Control who is allowed to tag you across COCPIT.</p>
          </div>
          
          {isPrivacyLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
          <div className="flex flex-col w-full">
            {[
              { id: 'everyone', label: 'Everyone' },
              { id: 'connections_only', label: 'Connections Only' },
              { id: 'followers_only', label: 'Followers Only' },
              { id: 'no_one', label: 'No One' }
            ].map(option => {
              const isSelected = tagPermission === option.id;
              return (
                <div 
                  key={option.id} 
                  onClick={() => updateSettings({ tagPermission: option.id as any })}
                  className="flex flex-row items-center justify-between py-4 cursor-pointer"
                >
                  <span className="text-[16px] font-normal text-black leading-[24px]">{option.label}</span>
                  {/* Custom Radio */}
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ${isSelected ? 'border-[#6366F1]' : 'border-[#6B7280]'}`}>
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-[#6366F1]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="flex flex-col w-full gap-4">
          <div className="flex flex-col w-full mb-2">
            <h2 className="text-[18px] font-medium text-black leading-[26px]">Active sessions</h2>
            <p className="text-[12px] font-normal text-[#6B7280] leading-[16px]">Control how you share your information and manage device access.</p>
          </div>

          {isSessionsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
          <>
          <div className="flex flex-col w-full gap-2">
            {sessions.map(session => (
              <div key={session.id} className="flex flex-row items-center justify-between py-4 w-full">
                <div className="flex flex-row items-center gap-4">
                  {/* Device Icon */}
                  <div className="flex items-center justify-center w-[48px] h-[48px] rounded-full bg-black">
                    {session.type === 'laptop' ? (
                      <Laptop className="w-5 h-5 text-white" strokeWidth={1.5} />
                    ) : (
                      <Smartphone className="w-5 h-5 text-white" strokeWidth={1.5} />
                    )}
                  </div>
                  {/* Device Info */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[16px] font-normal text-black leading-[24px]">{session.device}</span>
                    <span className="text-[12px] font-normal text-[#6B7280] leading-[16px]">
                      {session.location} {session.createdAt && !session.isCurrent ? formatDistanceToNow(new Date(session.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                {session.isCurrent ? (
                  <div className="flex items-center justify-center px-3 py-1 bg-[#F0FDF4] rounded-full">
                    <span className="text-[14px] font-normal text-[#22C55E]">This device</span>
                  </div>
                ) : (
                  <button
                    onClick={() => openPrivacyLogout('single', session.id)}
                    className="flex flex-row items-center justify-center gap-2 px-3 py-1 rounded-full"
                  >
                    <LogOut className="w-4 h-4 text-[#FF6B6B]" strokeWidth={1.5} />
                    <span className="text-[14px] font-normal text-[#FF6B6B]">Log out</span>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {sessions.length > 1 && (
            <div className="flex justify-center w-full py-3 mt-4">
              <button
                onClick={() => openPrivacyLogout('all')}
                className="text-[14px] font-normal text-[#FF6B6B]"
              >
                Log out from all other device
              </button>
            </div>
          )}
          </>
          )}
        </div>

        {/* Modals */}
        <VerifyIdentityModal 
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
        />
        <LogoutModal
          isOpen={logoutTarget !== null}
          onClose={closePrivacyLogout}
          onConfirm={() => {
            if (logoutTarget === 'all') {
              logoutOtherSessions();
              closePrivacyLogout();
            } else if (logoutTarget === 'single' && sessionToLogout !== null) {
              logoutSession(sessionToLogout);
              closePrivacyLogout();
            }
          }}
          mode={logoutTarget || 'single'}
          isLoading={isLoggingOut || isLoggingOutOthers}
        />

      </div>
    </div>
  );
}
