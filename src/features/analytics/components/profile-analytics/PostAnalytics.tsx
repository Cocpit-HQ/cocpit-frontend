"use client";

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export const PostAnalytics = () => {
  const [locationType, setLocationType] = useState<'Cities' | 'Countries'>('Cities');

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex flex-row items-center w-full mb-8">
        <Link href="/analytics" className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center mr-4 hover:bg-gray-50 transition-colors">
          <Icon icon="lucide:chevron-left" className="w-5 h-5 text-gray-700" />
        </Link>
        <div className="flex flex-col">
          <h2 className="text-[20px] font-semibold text-gray-900 font-['Poppins']">Post analytics</h2>
          <p className="text-[12px] text-gray-500 font-['Poppins']">Understand how this post performed and who engaged with it</p>
        </div>
      </div>

      {/* Content performance card */}
      <div className="border border-gray-100 rounded-[20px] p-6 shadow-sm flex flex-col mb-6 bg-white">
        <div className="flex flex-row justify-between items-center w-full mb-6">
          <h3 className="text-[16px] font-semibold text-gray-900 font-['Poppins']">Content performance</h3>
          <div className="flex items-center gap-1 cursor-pointer">
            <span className="text-[12px] text-gray-500 font-['Poppins']">Last 30 Days</span>
            <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* Post preview */}
        <div className="flex flex-row gap-4 mb-8">
          <div className="w-[80px] h-[80px] bg-indigo-50 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-[#EEF2FF] to-[#C7D2FE] flex items-center justify-center relative">
              <Icon icon="lucide:layout-template" className="w-8 h-8 text-[#6366F1] opacity-50" />
              {/* Mocking the UI lines from the screenshot */}
              <div className="absolute top-2 left-2 right-2 h-2 bg-white rounded-sm opacity-50" />
              <div className="absolute top-5 left-2 w-8 h-8 bg-white rounded-sm opacity-50" />
            </div>
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#EEF2FF] text-[#6366F1] text-[10px] font-medium px-2 py-0.5 rounded-[4px] font-['Poppins']">Article</span>
              <span className="text-[10px] text-gray-400 font-['Poppins']">• Published on oct 15 2026</span>
            </div>
            <p className="text-[14px] font-medium text-gray-900 font-['Poppins'] leading-snug line-clamp-3">
              Redesigning the SaaS Onboarding Experience We often design for the first interaction. The first click. The first impression...
            </p>
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex flex-row justify-between w-full border-t border-gray-50 pt-6">
          {[
            { label: 'Views', value: '12.4k' },
            { label: 'Likes', value: '1.2k' },
            { label: 'Comments', value: '2.1k' },
            { label: 'Share', value: '342' },
            { label: 'Save', value: '23' },
            { label: 'Engagement rate', value: '9%' },
          ].map((metric, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-['Poppins'] mb-1">{metric.label}</span>
              <span className="text-[18px] font-bold text-gray-900 font-['Poppins'] leading-none">{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Middle row: Total reach and Direct impact */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Total reach */}
        <div className="border border-gray-100 rounded-[20px] p-6 shadow-sm flex flex-col bg-white overflow-hidden relative">
          <div className="flex justify-between items-start mb-6 z-10">
            <div className="flex flex-col">
              <span className="text-[12px] text-gray-500 font-medium font-['Poppins'] mb-1">Total reach</span>
              <span className="text-[24px] font-bold text-gray-900 font-['Poppins'] leading-none">32.1k</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-[10px] text-gray-400 font-['Poppins']">Last 30 days</span>
            </div>
          </div>
          
          <div className="flex-1 w-full relative min-h-[100px] z-10 mt-4">
            <svg viewBox="0 0 400 100" className="w-full h-full preserve-aspect-ratio-none absolute -left-6" style={{ width: 'calc(100% + 48px)' }} preserveAspectRatio="none">
              <path 
                d="M 0,80 C 50,80 80,90 120,80 C 160,70 180,30 220,30 C 260,30 280,45 320,40 C 360,35 380,20 400,10" 
                fill="none" 
                stroke="#818CF8" 
                strokeWidth="3" 
                strokeLinecap="round"
              />
              <circle cx="0" cy="80" r="4" fill="#818CF8" />
              <circle cx="400" cy="10" r="4" fill="#818CF8" />
            </svg>
          </div>
        </div>

        {/* Direct impact */}
        <div className="border border-gray-100 rounded-[20px] p-6 shadow-sm flex flex-col bg-white">
          <div className="flex flex-col mb-6">
            <h3 className="text-[14px] font-semibold text-gray-900 font-['Poppins'] mb-1">Direct impact</h3>
            <span className="text-[10px] text-gray-400 font-['Poppins']">Actions taken directly from this post</span>
          </div>
          
          <div className="flex flex-col gap-4">
            {[
              { label: 'Profile visits', value: '842', trend: '+45% vs avg' },
              { label: 'New followers', value: '124', trend: '+22% vs avg' },
              { label: 'Opportunity views', value: '18', trend: '+22% vs avg' },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-gray-900 font-['Poppins']">{item.label}</span>
                  <span className="text-[10px] text-gray-400 font-['Poppins']">Last 30 days</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-bold text-gray-900 font-['Poppins']">{item.value}</span>
                  <span className="text-[10px] text-emerald-500 font-medium font-['Poppins']">{item.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audience demographics */}
      <div className="border border-gray-100 rounded-[20px] p-6 shadow-sm flex flex-col bg-white">
        <div className="flex flex-row justify-between items-center w-full mb-8">
          <h3 className="text-[14px] font-semibold text-gray-900 font-['Poppins']">Audience demographics</h3>
          <div className="flex items-center gap-1 cursor-pointer">
            <span className="text-[10px] text-gray-400 font-['Poppins']">Last 30 Days</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10">
          {/* Cities */}
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[12px] font-semibold text-gray-900 font-['Poppins']">Cities</span>
              <div className="flex bg-[#F3F4F6] rounded-full p-1">
                <button 
                  onClick={() => setLocationType('Cities')}
                  className={`px-3 py-0.5 text-[10px] font-medium font-['Poppins'] rounded-full transition-colors ${locationType === 'Cities' ? 'bg-white text-[#6366F1] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Cities
                </button>
                <button 
                  onClick={() => setLocationType('Countries')}
                  className={`px-3 py-0.5 text-[10px] font-medium font-['Poppins'] rounded-full transition-colors ${locationType === 'Countries' ? 'bg-white text-[#6366F1] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Countries
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { name: 'Mumbai', value: 45 },
                { name: 'Bengaluru', value: 22 },
                { name: 'Dubai', value: 18 },
                { name: 'Delhi', value: 10 },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-medium text-gray-900 font-['Poppins']">{item.name}</span>
                    <span className="text-[10px] font-bold text-gray-900 font-['Poppins']">{item.value}%</span>
                  </div>
                  <div className="w-full h-[4px] bg-[#EEF2FF] rounded-full">
                    <div className="h-full bg-[#6366F1] rounded-full" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div className="flex flex-col w-full">
            <span className="text-[12px] font-semibold text-gray-900 font-['Poppins'] mb-6 h-6 flex items-center">Audience industry</span>
            <div className="flex flex-col gap-4">
              {[
                { name: 'Software development', value: 45 },
                { name: 'Fintech & banking', value: 22 },
                { name: 'UX/UI design agencies', value: 18 },
                { name: 'Others', value: 10 },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-medium text-gray-900 font-['Poppins']">{item.name}</span>
                    <span className="text-[10px] font-bold text-gray-900 font-['Poppins']">{item.value}%</span>
                  </div>
                  <div className="w-full h-[4px] bg-[#EEF2FF] rounded-full">
                    <div className="h-full bg-[#6366F1] rounded-full" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
