'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileOnboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-onboard flex items-center justify-center">
      <div className="w-[480px] bg-white/95 rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900">Set up your profile</h2>
        <p className="text-sm text-gray-600 mt-2">Let’s start by adding a profile picture.</p>

        <div className="mt-6 flex flex-col items-center">
          <div className="w-40 h-40 rounded-full bg-purple-50 flex items-center justify-center overflow-hidden">
            <img src="/assets/onboarding_profile_upload.svg" alt="upload" className="w-full h-full object-cover" />
          </div>

          <label className="mt-4 cursor-pointer text-sm text-purple-700">
            <input type="file" accept="image/*" className="hidden" />
            Click to upload
          </label>

          <button
            onClick={() => router.push('/onboarding/account')}
            className="mt-6 w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white py-3 rounded-lg font-semibold"
          >
            Continue
          </button>

          <button
            onClick={() => router.push('/')}
            className="mt-3 text-purple-700 underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
