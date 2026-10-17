"use client";

import React from 'react';

interface SettingCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  variant?: 'card' | 'flat';
}

export const SettingCard = React.memo(function SettingCard({
  title,
  description,
  action,
  children,
  className = '',
  headerClassName = '',
  variant = 'flat',
}: SettingCardProps) {
  const hasHeader = Boolean(title || description || action);

  if (variant === 'card') {
    return (
      <section className={`w-full bg-ds-surface-1 border border-ds-border rounded-xl overflow-hidden transition-colors ${className}`}>
        {hasHeader && (
          <div className={`p-4 md:p-5 flex items-start justify-between gap-4 border-b border-ds-border/60 ${headerClassName}`}>
            <div className="flex flex-col gap-1 min-w-0">
              {title && (
                typeof title === 'string' ? (
                  <h3 className="ds-text-body-2 text-ds-text-primary truncate">{title}</h3>
                ) : (
                  title
                )
              )}
              {description && (
                typeof description === 'string' ? (
                  <p className="ds-text-small text-ds-text-secondary">{description}</p>
                ) : (
                  description
                )
              )}
            </div>
            {action && <div className="shrink-0 flex items-center">{action}</div>}
          </div>
        )}

        <div className="flex flex-col divide-y divide-ds-border/40">
          {children}
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full flex flex-col justify-start items-start ${className}`}>
      {hasHeader && (
        <div className={`py-2 w-full flex items-start justify-between gap-4 ${headerClassName}`}>
          <div className="flex flex-col min-w-0">
            {title && (
              typeof title === 'string' ? (
                <h3 className="text-base font-medium text-ds-text-primary font-['DM_Sans'] leading-6 mb-1">{title}</h3>
              ) : (
                title
              )
            )}
            {description && (
              typeof description === 'string' ? (
                <p className="text-sm font-normal text-ds-text-secondary font-['DM_Sans'] leading-5">{description}</p>
              ) : (
                description
              )
            )}
          </div>
          {action && <div className="shrink-0 flex items-center">{action}</div>}
        </div>
      )}

      <div className="w-full flex flex-col divide-y divide-ds-border">
        {children}
      </div>
    </section>
  );
});
