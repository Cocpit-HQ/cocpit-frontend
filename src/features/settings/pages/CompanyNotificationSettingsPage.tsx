"use client";

import React, { useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { SettingToggle } from '../components/SettingToggle';
import { useCompanyNotificationSettings } from '../hooks/useCompanyNotificationSettings';

type NotificationKey = 'all' | 'posts' | 'jobs' | 'messages' | 'emails';

interface NotificationItemConfig {
  key: NotificationKey;
  label: string;
  description: string;
}

const NOTIFICATION_ITEMS: readonly NotificationItemConfig[] = [
  {
    key: 'all',
    label: 'All organization notifications',
    description: 'Control all alerts and updates for this organization',
  },
  {
    key: 'posts',
    label: 'Post updates',
    description: 'When users engage with your organization posts',
  },
  {
    key: 'jobs',
    label: 'Job applicants',
    description: 'When new candidates apply for your job listings',
  },
  {
    key: 'messages',
    label: 'Page messages',
    description: 'When someone sends a direct inquiry to the organization',
  },
  {
    key: 'emails',
    label: 'Email notifications',
    description: 'Receive email alerts at the organization contact address',
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

export function CompanyNotificationSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '';

  const { settings, isLoading, updateSettings } = useCompanyNotificationSettings();

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const handleToggle = useCallback(
    (key: NotificationKey, nextVal: boolean) => {
      const current = settingsRef.current;
      const updated = {
        ...(current || {
          all: true,
          posts: true,
          jobs: true,
          messages: true,
          emails: true,
          push: true,
        }),
        [key]: nextVal,
      };
      settingsRef.current = updated;
      updateSettings(updated);
    },
    [updateSettings]
  );

  return (
    <div className="w-full max-w-[712px] md:min-h-[490px] p-[8px_0px] flex flex-col items-start gap-[12px] rounded-[0px_24px_24px_0px] text-ds-text-primary font-sans">
      <div className="w-full max-w-[712px] px-3 sm:px-4 py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-2">
        {/* Header / Mobile Back */}
        <div className="self-stretch inline-flex justify-start items-center gap-3 mb-1">
          <button
            type="button"
            onClick={() => router.push(basePath)}
            aria-label="Back to settings menu"
            className="flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
          >
            <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
          </button>
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


