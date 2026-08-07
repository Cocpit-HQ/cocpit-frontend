"use client";

import React from 'react';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { Loader2 } from 'lucide-react';

export function NotificationSettingsPage() {
  const { settings, isLoading, isError, updateSettings, isUpdating } = useNotificationSettings();

  const handleToggle = (key: keyof NonNullable<typeof settings>) => {
    if (!settings) return;
    
    const newState = { ...settings, [key]: !settings[key] };
    // If toggling 'all', set all others to match
    if (key === 'all') {
      Object.keys(newState).forEach(k => {
        newState[k as keyof NonNullable<typeof settings>] = newState.all;
      });
    } else {
      // If unchecking a specific one, uncheck 'all'
      if (!newState[key]) newState.all = false;
      // If checking a specific one and all others are checked, check 'all'
      const allOthersChecked = Object.keys(newState)
        .filter(k => k !== 'all')
        .every(k => newState[k as keyof NonNullable<typeof settings>]);
      if (allOthersChecked) newState.all = true;
    }
    
    updateSettings(newState);
  };

  const ToggleItem = ({ 
    title, 
    description,
    settingKey 
  }: { 
    title: string, 
    description: string,
    settingKey: keyof NonNullable<typeof settings> 
  }) => {
    const isChecked = settings?.[settingKey] ?? false;

    return (
      <div className="flex flex-row items-center justify-between py-[12px] px-4 w-full h-[68px]">
        <div className="flex flex-col justify-center">
          <span className="text-[16px] font-normal text-black leading-[24px]">{title}</span>
          <span className="text-[14px] font-normal text-[#6B7280] leading-[20px]">{description}</span>
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={() => handleToggle(settingKey)}
          disabled={isUpdating || isLoading}
          className={`relative w-[44px] h-[24px] rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
            isChecked ? 'bg-[#6366F1]' : 'bg-gray-200'
          }`}
        >
          <span className={`absolute top-[2px] bg-white w-[20px] h-[20px] rounded-full transition-all ${
            isChecked ? 'left-[22px]' : 'left-[2px]'
          }`} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">
        
        {/* Header */}
        <div className="flex flex-col w-full h-[56px] justify-between mb-2">
          <h1 className="text-[24px] font-semibold text-black leading-[32px]">Notifications</h1>
          <p className="text-[16px] font-normal text-[#6B7280] leading-[24px]">Manage notification preferences</p>
        </div>

        {/* Content */}
        <div className="flex flex-col w-full gap-2">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          
          {isError && (
            <div className="p-4 text-sm text-red-500 bg-red-50 rounded-lg">
              Failed to load notification settings.
            </div>
          )}

          {settings && (
            <>
          
          <ToggleItem 
            title="All notifications" 
            description="Control all alerts and updates" 
            settingKey="all" 
          />
          
          <ToggleItem 
            title="Post notifications" 
            description="Control notifications for post" 
            settingKey="posts" 
          />
          
          <ToggleItem 
            title="Job alerts" 
            description="New job matches and recommendations" 
            settingKey="jobs" 
          />
          
          <ToggleItem 
            title="Message notifications" 
            description="Control notifications for chats and conversations" 
            settingKey="messages" 
          />
          
          <ToggleItem 
            title="Email notifications" 
            description="Control updates and alerts sent directly to your email" 
            settingKey="emails" 
          />

          <ToggleItem 
            title="Push notification" 
            description="Push notifications on your mobile device for real-time awareness." 
            settingKey="push" 
          />

          </>
          )}

        </div>

      </div>
    </div>
  );
}
