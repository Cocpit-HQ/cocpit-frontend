"use client";

import React from 'react';
import { useCompanyNotificationSettings } from '../../hooks/useCompanyNotificationSettings';
import { NotificationPreferences } from '@/services/api/settings';
import { Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';

export function CompanyNotificationSettingsPage() {
  const { settings, isLoading, isError, updateSettings, isUpdating } = useCompanyNotificationSettings();

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!settings) return;
    
    const newState = { ...settings, [key]: !settings[key] };
    
    // If toggling 'all', set all others to match
    if (key === 'all') {
      Object.keys(newState).forEach(k => {
        newState[k as keyof NotificationPreferences] = newState.all;
      });
    } else {
      // If unchecking a specific one, uncheck 'all'
      if (!newState[key]) newState.all = false;
      // If checking a specific one and all others are checked, check 'all'
      const allOthersChecked = Object.keys(newState)
        .filter(k => k !== 'all')
        .every(k => newState[k as keyof NotificationPreferences]);
      if (allOthersChecked) newState.all = true;
    }
    
    // Message sub-toggles logic
    if (key === 'messages') {
      // If messages turns off, turn off sub-toggles
      // If messages turns on, turn them on
      newState.messageChats = newState.messages;
      newState.messageJobs = newState.messages;
    } else if (key === 'messageChats' || key === 'messageJobs') {
      // If any sub-toggle is checked, ensure parent is checked
      if (newState.messageChats || newState.messageJobs) {
        newState.messages = true;
      } else {
        newState.messages = false;
      }
    }
    
    updateSettings(newState);
  };

  const ToggleItem = ({ 
    title, 
    description,
    settingKey 
  }: { 
    title: string, 
    description?: string,
    settingKey: keyof NotificationPreferences 
  }) => {
    const isChecked = settings?.[settingKey] ?? false;

    return (
      <div className="flex flex-row items-center justify-between py-[12px] px-4 w-full min-h-[68px]">
        <div className="flex flex-col justify-center">
          <span className="text-[16px] font-normal text-black dark:text-company-text leading-[24px]">{title}</span>
          {description && <span className="text-[14px] font-normal text-[#6B7280] dark:text-company-secondary leading-[20px]">{description}</span>}
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={() => handleToggle(settingKey)}
          disabled={isUpdating || isLoading}
          className={`relative w-[44px] h-[24px] rounded-full transition-colors focus:outline-none disabled:opacity-50 shrink-0 ${
            isChecked ? 'bg-[#1A73E8]' : 'bg-gray-200'
          }`}
        >
          <span className={`absolute top-[2px] bg-white dark:bg-company-card w-[20px] h-[20px] rounded-full transition-all ${
            isChecked ? 'left-[22px]' : 'left-[2px]'
          }`} />
        </button>
      </div>
    );
  };

  const CheckboxItem = ({ 
    title, 
    settingKey 
  }: { 
    title: string, 
    settingKey: keyof NotificationPreferences 
  }) => {
    const isChecked = settings?.[settingKey] ?? false;

    return (
      <div className="flex flex-row items-center justify-between py-2 pr-4 w-full h-[40px]">
        <div className="flex flex-row items-center">
          <div className="w-[16px] h-[24px] border-l-[2px] border-b-[2px] border-[#A5B4FC] rounded-bl-[8px] mr-3 -translate-y-[6px]" />
          <span className="text-[14px] font-normal text-black dark:text-company-text leading-[20px]">{title}</span>
        </div>
        <input 
          type="checkbox"
          checked={isChecked}
          onChange={() => handleToggle(settingKey)}
          disabled={isUpdating || isLoading}
          className="w-4 h-4 rounded-[2px] border-gray-300 accent-[#1A73E8] cursor-pointer disabled:opacity-50"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20 relative">
      <div className="flex flex-col items-start px-[36px] py-[24px] gap-[24px] w-full border-b border-[#EEF2FF]">
        <div className="flex flex-col items-start p-0 gap-2 w-[466px]">
          <h1 className="text-[24px] font-semibold text-black dark:text-company-text leading-[32px] tracking-tight m-0 p-0">Notifications</h1>
          <p className="text-[14px] font-normal text-[#6B7280] dark:text-company-secondary leading-[20px] m-0 p-0">Manage notification preferences</p>
        </div>
      </div>

      <div className="flex flex-col w-full px-[36px] py-4 gap-8">
        
        {/* Content */}
        <div className="flex flex-col w-full gap-2 max-w-[698px]">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-[#1A73E8] dark:text-company-primary animate-spin" />
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
                description="New applications and listed jobs status" 
                settingKey="jobs" 
              />
              
              <div className="flex flex-col w-full">
                <ToggleItem 
                  title="Message notifications" 
                  description="Control notifications for chats and conversations" 
                  settingKey="messages" 
                />
                
                {/* Sub-options for Messages */}
                <div className="flex flex-col pl-4 ml-6 mt-1 mb-2 gap-1">
                  <CheckboxItem 
                    title="Chats" 
                    settingKey="messageChats" 
                  />
                  <CheckboxItem 
                    title="Jobs" 
                    settingKey="messageJobs" 
                  />
                </div>
              </div>
              
              <ToggleItem 
                title="Email notifications" 
                description="Control updates and alerts sent directly to your email" 
                settingKey="emails" 
              />
            </>
          )}

        </div>

      </div>
    </div>
  );
}
