import React from 'react';
import { Icon } from '@iconify/react';

interface OfferDeadlineBadgeProps {
  days: number;
}

export const OfferDeadlineBadge: React.FC<OfferDeadlineBadgeProps> = ({ days }) => {
  const getBadgeColors = () => {
    if (days <= 3) {
      return {
        bg: 'bg-ds-error/10',
        text: 'text-ds-error',
        border: 'border-ds-error/20',
        icon: 'lucide:alert-circle'
      };
    } else if (days <= 7) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-100',
        icon: 'lucide:clock'
      };
    } else {
      return {
        bg: 'bg-ds-surface-2',
        text: 'text-ds-text-secondary',
        border: 'border-ds-border',
        icon: 'lucide:calendar'
      };
    }
  };

  const colors = getBadgeColors();
  const text = days === 1 ? '1 day left' : `${days} days left`;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium font-dm-sans ${colors.bg} ${colors.text} ${colors.border}`}>
      <Icon icon={colors.icon} className="w-3.5 h-3.5" />
      <span>{text}</span>
    </div>
  );
};

export default OfferDeadlineBadge;
