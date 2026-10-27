"use client";

import React, { useCallback, useRef } from 'react';
import { CheckboxCheckIcon } from '@/components/icons';
import { SettingToggle } from '../components/SettingToggle';
import { useCompanyNotificationSettings } from '../hooks/useCompanyNotificationSettings';
import { MobileSettingsHeader } from '../components/MobileSettingsView';
import { NotificationPreferences } from '@/services/api/settings';

type PrimaryNotificationKey = 'all' | 'posts' | 'jobs' | 'messages' | 'emails';
type SubNotificationKey = 'messageChats' | 'messageJobs';
type NotificationKey = PrimaryNotificationKey | SubNotificationKey;

interface NotificationItemConfig {
  key: PrimaryNotificationKey;
  label: string;
  description: string;
}

const NOTIFICATION_ITEMS: readonly NotificationItemConfig[] = [
  {
    key: 'all',
    label: 'All notifications',
    description: 'Control all alerts and updates',
  },
  {
    key: 'posts',
    label: 'Post notifications',
    description: 'Control notifications for post',
  },
  {
    key: 'jobs',
    label: 'Job alerts',
    description: 'New job matches and recommendations',
  },
  {
    key: 'messages',
    label: 'Message notifications',
    description: 'Control notifications for chats and conversations',
  },
  {
    key: 'emails',
    label: 'Email notifications',
    description: 'Control updates and alerts sent directly to your email',
  },
];

interface SubNotificationItemConfig {
  key: SubNotificationKey;
  label: string;
}

const MESSAGE_SUB_ITEMS: readonly SubNotificationItemConfig[] = [
  { key: 'messageChats', label: 'Chats' },
  { key: 'messageJobs', label: 'Jobs' },
];

interface NotificationRowProps {
  itemKey: PrimaryNotificationKey;
  label: string;
  description: string;
  checked: boolean;
  onToggle: (key: PrimaryNotificationKey, nextVal: boolean) => void;
  disabled: boolean;
}

const NotificationRow = React.memo(function NotificationRow({
  itemKey,
  label,
  description,
  checked,
  onToggle,
  disabled,
}: NotificationRowProps) {
  const handleToggle = useCallback(() => {
    onToggle(itemKey, !checked);
  }, [onToggle, itemKey, checked]);

  return (
    <div className="self-stretch py-2 flex flex-row justify-between items-center gap-3">
      <div className={`flex-1 min-w-0 pr-2 inline-flex flex-col justify-center items-start ${disabled ? 'opacity-50' : ''}`}>
        <div className="justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
          {label}
        </div>
        <div className="justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
          {description}
        </div>
      </div>
      <SettingToggle
        checked={checked}
        onChange={handleToggle}
        disabled={disabled}
        ariaLabel={`Toggle ${label}`}
      />
    </div>
  );
});

interface SubNotificationRowProps {
  itemKey: SubNotificationKey;
  label: string;
  checked: boolean;
  onToggle: (key: SubNotificationKey, nextVal: boolean) => void;
  disabled: boolean;
  isFirst: boolean;
  isLast: boolean;
}

const SubNotificationRow = React.memo(function SubNotificationRow({
  itemKey,
  label,
  checked,
  onToggle,
  disabled,
  isFirst,
  isLast,
}: SubNotificationRowProps) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onToggle(itemKey, !checked);
    }
  }, [disabled, onToggle, itemKey, checked]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
        e.preventDefault();
        onToggle(itemKey, !checked);
      }
    },
    [disabled, onToggle, itemKey, checked]
  );

  return (
    <div className="self-stretch flex flex-row items-center justify-between py-1.5 pl-3 sm:pl-4 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Continuous Vector Connector Branch:
            Top item has straight vertical stroke with rounded top;
            Last item continues vertically then smoothly curves into an arc */}
        <div className="w-5 h-9 relative flex items-center justify-start shrink-0">
          {!isLast ? (
            <svg width="20" height="36" viewBox="0 0 20 36" fill="none" className="shrink-0">
              <path
                d={isFirst ? "M6 6V36" : "M6 0V36"}
                stroke="#EC6229"
                strokeWidth="2.5"
                strokeLinecap={isFirst ? "round" : "butt"}
              />
            </svg>
          ) : (
            <svg width="20" height="36" viewBox="0 0 20 36" fill="none" className="shrink-0">
              <path
                d="M6 0V16C6 24 10 30 16 32"
                stroke="#EC6229"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
        <span className="text-ds-text-primary text-base font-normal font-['DM_Sans'] leading-6">
          {label}
        </span>
      </div>

      {/* Cocpit Branded Orange Checkbox (Figma spec: 24x24px, 4px radius, #EC6229 fill, #030303 check icon) */}
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={`Toggle ${label} notifications`}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`w-[24px] h-[24px] rounded-[4px] flex items-center justify-center transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ds-accent mr-1 sm:mr-1.5 ${
          checked
            ? 'bg-[#EC6229] pt-[5px] pb-[6px] px-[4px]'
            : 'border-2 border-ds-border bg-transparent hover:border-ds-border-active'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {checked && (
          <CheckboxCheckIcon className="w-[16px] h-[13px] text-[#030303] shrink-0" fill="#030303" />
        )}
      </button>
    </div>
  );
});

// Feature flags: Set to false once Job Alerts and Message Notifications features are ready for Business Profiles (SCRUM-1480)
const DISABLE_BUSINESS_JOB_ALERTS = true;
const DISABLE_BUSINESS_MESSAGE_NOTIFICATIONS = true;

export function CompanyNotificationSettingsPage() {
  const { settings, isLoading, updateSettings } = useCompanyNotificationSettings();

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const handleToggle = useCallback(
    (key: PrimaryNotificationKey, nextVal: boolean) => {
      // Prevent toggling when feature is disabled for business profiles
      if (
        (DISABLE_BUSINESS_JOB_ALERTS && key === 'jobs') ||
        (DISABLE_BUSINESS_MESSAGE_NOTIFICATIONS && key === 'messages')
      ) {
        return;
      }

      const current = settingsRef.current || {
        all: true,
        posts: true,
        jobs: true,
        messages: true,
        emails: true,
        push: true,
        messageChats: true,
        messageJobs: true,
      };

      const updated: NotificationPreferences = {
        ...current,
        [key]: nextVal,
      };

      if (key === 'all') {
        updated.posts = nextVal;
        updated.jobs = DISABLE_BUSINESS_JOB_ALERTS ? false : nextVal;
        updated.messages = DISABLE_BUSINESS_MESSAGE_NOTIFICATIONS ? false : nextVal;
        updated.emails = nextVal;
        updated.messageChats = DISABLE_BUSINESS_MESSAGE_NOTIFICATIONS ? false : nextVal;
        updated.messageJobs = DISABLE_BUSINESS_MESSAGE_NOTIFICATIONS ? false : nextVal;
      } else if (key === 'messages') {
        if (nextVal) {
          // If enabling messages and both were false, restore both to true
          if (!updated.messageChats && !updated.messageJobs) {
            updated.messageChats = true;
            updated.messageJobs = true;
          }
        }
      }

      // Upward cascade to Master "all"
      updated.all = !!(
        updated.posts &&
        (DISABLE_BUSINESS_JOB_ALERTS ? true : updated.jobs) &&
        (DISABLE_BUSINESS_MESSAGE_NOTIFICATIONS ? true : (updated.messages && (updated.messageChats ?? true) && (updated.messageJobs ?? true))) &&
        updated.emails
      );

      settingsRef.current = updated;
      updateSettings(updated);
    },
    [updateSettings]
  );

  const handleSubToggle = useCallback(
    (key: SubNotificationKey, nextVal: boolean) => {
      const current = settingsRef.current || {
        all: true,
        posts: true,
        jobs: true,
        messages: true,
        emails: true,
        push: true,
        messageChats: true,
        messageJobs: true,
      };

      const updated: NotificationPreferences = {
        ...current,
        [key]: nextVal,
      };

      if (nextVal) {
        // Checking any sub-option automatically activates parent message notifications
        updated.messages = true;
      } else {
        // If both sub-options are unchecked, turn parent message notifications off
        const otherKey = key === 'messageChats' ? 'messageJobs' : 'messageChats';
        const otherVal = updated[otherKey] ?? true;
        if (!otherVal) {
          updated.messages = false;
        }
      }

      // Upward cascade to Master "all"
      updated.all = !!(
        updated.posts &&
        updated.jobs &&
        updated.messages &&
        (updated.messageChats ?? true) &&
        (updated.messageJobs ?? true) &&
        updated.emails
      );

      settingsRef.current = updated;
      updateSettings(updated);
    },
    [updateSettings]
  );

  if (isLoading || !settings) {
    return (
      <div className="w-full max-w-[712px] md:min-h-[490px] p-0 md:p-[8px_0px] flex flex-col items-start gap-0 md:gap-[12px] rounded-[0px_24px_24px_0px] text-ds-text-primary font-sans">
        {/* Mobile Header: < Notification */}
        <MobileSettingsHeader title="Notification" />

        <div className="w-full max-w-[712px] px-4 md:px-4 py-0 md:py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-2">
          {/* Desktop Header */}
          <div className="hidden md:block self-stretch mb-1">
            <div className="ds-text-body-2 text-ds-text-primary">Notifications</div>
          </div>

          {NOTIFICATION_ITEMS.map((item, index) => (
            <div
              key={item.key}
              className={`self-stretch py-3 flex flex-row justify-between items-center gap-3 ${
                index !== NOTIFICATION_ITEMS.length - 1 ? 'border-b border-ds-border' : ''
              }`}
            >
              <div className="flex-1 min-w-0 pr-2 flex flex-col gap-2">
                <div className="w-40 h-5 rounded bg-ds-surface-2 animate-pulse" />
                <div className="w-64 h-3.5 rounded bg-ds-surface-1 animate-pulse" />
              </div>
              <div className="w-11 h-6 rounded-full bg-ds-surface-2 animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const messagesEnabled = settings.messages;

  return (
    <div className="w-full max-w-[712px] md:min-h-[490px] p-0 md:p-[8px_0px] flex flex-col items-start gap-0 md:gap-[12px] rounded-[0px_24px_24px_0px] text-ds-text-primary font-sans">
      {/* Mobile Header: < Notification */}
      <MobileSettingsHeader title="Notification" />

      <div className="w-full max-w-[712px] px-4 md:px-4 py-0 md:py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-2">
        {/* Desktop Header */}
        <div className="hidden md:block self-stretch mb-1">
          <div className="ds-text-body-2 text-ds-text-primary">Notifications</div>
        </div>

        {NOTIFICATION_ITEMS.map((item, index) => {
          const isLast = index === NOTIFICATION_ITEMS.length - 1;
          const isMessages = item.key === 'messages';
          const isItemDisabledForBusiness = item.key === 'jobs' || item.key === 'messages';
          const isChecked = item.key === 'all'
            ? !!(settings.posts && settings.emails)
            : isItemDisabledForBusiness
            ? false
            : !!settings[item.key];

          return (
            <div
              key={item.key}
              className={`self-stretch ${!isLast ? 'border-b border-ds-border' : ''}`}
            >
              <NotificationRow
                itemKey={item.key}
                label={item.label}
                description={item.description}
                checked={isChecked}
                onToggle={handleToggle}
                disabled={isLoading || isItemDisabledForBusiness}
              />

              {/* Render dynamic Subsetting Branch for Message notifications */}
              {isMessages && !isItemDisabledForBusiness && messagesEnabled && (
                <div className="flex flex-col self-stretch pb-2 pt-0.5">
                  {MESSAGE_SUB_ITEMS.map((sub, subIdx) => (
                    <SubNotificationRow
                      key={sub.key}
                      itemKey={sub.key}
                      label={sub.label}
                      checked={settings[sub.key] ?? false}
                      onToggle={handleSubToggle}
                      disabled={isLoading}
                      isFirst={subIdx === 0}
                      isLast={subIdx === MESSAGE_SUB_ITEMS.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


