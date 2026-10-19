"use client";

import React, { useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { SettingToggle } from '../components/SettingToggle';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { MobileSettingsHeader } from '../components/MobileSettingsView';

type NotificationKey = 'all' | 'posts' | 'jobs' | 'messages' | 'emails';

interface NotificationItemConfig {
  key: NotificationKey;
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

interface NotificationRowProps {
  itemKey: NotificationKey;
  label: string;
  description: string;
  checked: boolean;
  onToggle: (key: NotificationKey, nextVal: boolean) => void;
  disabled: boolean;
  isLast?: boolean;
}

const NotificationRow = React.memo(function NotificationRow({
  itemKey,
  label,
  description,
  checked,
  onToggle,
  disabled,
  isLast = false,
}: NotificationRowProps) {
  const handleToggle = useCallback(() => {
    onToggle(itemKey, !checked);
  }, [onToggle, itemKey, checked]);

  return (
    <div
      className={`self-stretch py-2 flex flex-row justify-between items-center gap-3 ${
        !isLast ? 'border-b border-ds-border' : ''
      }`}
    >
      <div className="flex-1 min-w-0 pr-2 inline-flex flex-col justify-center items-start">
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

export function NotificationSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/notifications';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const { settings, isLoading, updateSettings } = useNotificationSettings();

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const handleToggle = useCallback(
    (key: NotificationKey, nextVal: boolean) => {
      const current = settingsRef.current;
      const baseSettings = current || {
        all: true,
        posts: true,
        jobs: true,
        messages: true,
        emails: true,
        push: true,
      };

      let updated = { ...baseSettings, [key]: nextVal };

      if (key === 'all') {
        updated.posts = nextVal;
        updated.jobs = nextVal;
        updated.messages = nextVal;
        updated.emails = nextVal;
      } else {
        updated.all = !!(
          updated.posts &&
          updated.jobs &&
          updated.messages &&
          updated.emails
        );
      }

      settingsRef.current = updated;
      updateSettings(updated);
    },
    [updateSettings]
  );

  if (isLoading || !settings) {
    return (
      <div className="w-full max-w-[712px] md:min-h-[490px] p-0 md:p-[8px_0px] flex flex-col items-start gap-0 md:gap-[12px] rounded-[0px_24px_24px_0px] text-ds-text-primary font-sans">
        <MobileSettingsHeader title="Notification" />

        <div className="w-full max-w-[712px] px-4 md:px-4 py-0 md:py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-2">
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
          <NotificationRow
            key={item.key}
            itemKey={item.key}
            label={item.label}
            description={item.description}
            checked={settings[item.key]}
            onToggle={handleToggle}
            disabled={isLoading}
            isLast={index === NOTIFICATION_ITEMS.length - 1}
          />
        ))}
      </div>
    </div>
  );
}


