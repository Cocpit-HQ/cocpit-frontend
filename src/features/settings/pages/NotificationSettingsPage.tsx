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
  const [localChecked, setLocalChecked] = React.useState(checked);

  React.useEffect(() => {
    setLocalChecked(checked);
  }, [checked]);

  const handleToggle = useCallback(() => {
    setLocalChecked((prev) => {
      const next = !prev;
      onToggle(itemKey, next);
      return next;
    });
  }, [onToggle, itemKey]);

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
        checked={localChecked}
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
            checked={settings ? settings[item.key] : true}
            onToggle={handleToggle}
            disabled={isLoading}
            isLast={index === NOTIFICATION_ITEMS.length - 1}
          />
        ))}
      </div>
    </div>
  );
}


