'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import './access-denied.css';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

export default function AccessDenied({
  title = 'Access Denied',
  message = "You don't have permission to access this page. Contact your organization admin to request access.",
  showBackButton = true,
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="access-denied">
      <div className="access-denied__card">
        {/* Icon */}
        <div className="access-denied__icon-wrapper">
          <ShieldX className="access-denied__icon" strokeWidth={1.5} />
        </div>

        {/* Text */}
        <h1 className="access-denied__title">{title}</h1>
        <p className="access-denied__message">{message}</p>

        {/* Actions */}
        <div className="access-denied__actions">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="access-denied__btn access-denied__btn--secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}
          <button
            onClick={() => router.push('/feed')}
            className="access-denied__btn access-denied__btn--primary"
          >
            <Home className="w-4 h-4" />
            Go to Feed
          </button>
        </div>
      </div>
    </div>
  );
}
