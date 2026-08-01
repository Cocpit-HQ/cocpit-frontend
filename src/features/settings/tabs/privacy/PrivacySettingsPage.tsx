"use client";

import React, { useState } from 'react';
import { Laptop, Smartphone, LogOut, Loader2 } from 'lucide-react';
import { LogoutModal } from '../account/components/modals/LogoutModal';
import { usePrivacySettings } from '../../hooks/usePrivacySettings';
import { useActiveSessions } from '../../hooks/useActiveSessions';
import { formatDistanceToNow } from 'date-fns';

export function PrivacySettingsPage() {
  const { settings: privacy, isLoading: isPrivacyLoading, updateSettings } = usePrivacySettings();
  const { sessions, isLoading: isSessionsLoading, logoutSession, logoutOtherSessions, isLoggingOut, isLoggingOutOthers } = useActiveSessions();
  
  const [logoutTarget, setLogoutTarget] = useState<'single' | 'all' | null>(null);
  const [sessionToLogout, setSessionToLogout] = useState<string | number | null>(null);

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
              { id: 'connections', label: 'Connections Only' },
              { id: 'followers', label: 'Followers Only' },
              { id: 'noone', label: 'No One' }
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
                    onClick={() => {
                      setSessionToLogout(session.id);
                      setLogoutTarget('single');
                    }}
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
                onClick={() => setLogoutTarget('all')}
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
        <LogoutModal 
          isOpen={logoutTarget !== null}
          onClose={() => {
            setLogoutTarget(null);
            setSessionToLogout(null);
          }}
          onConfirm={() => {
            if (logoutTarget === 'all') {
              logoutOtherSessions();
              setLogoutTarget(null);
            } else if (logoutTarget === 'single' && sessionToLogout !== null) {
              logoutSession(sessionToLogout);
              setLogoutTarget(null);
              setSessionToLogout(null);
            }
          }}
          mode={logoutTarget || 'single'}
          isLoading={isLoggingOut || isLoggingOutOthers}
        />

      </div>
    </div>
  );
}
