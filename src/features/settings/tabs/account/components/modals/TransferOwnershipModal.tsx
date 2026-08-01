"use client";

import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import Image from 'next/image';

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: () => void;
  companyName?: string;
}

const mockFollowers = [
  { id: 1, name: 'James Karl', avatar: 'https://i.pravatar.cc/150?u=james' },
  { id: 2, name: 'Liz Mean', avatar: 'https://i.pravatar.cc/150?u=liz' },
  { id: 3, name: 'Will Jackson', avatar: 'https://i.pravatar.cc/150?u=will' },
];

export function TransferOwnershipModal({ isOpen, onClose, onTransfer, companyName = 'Acme Inc.' }: TransferOwnershipModalProps) {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm font-poppins">
      <div className="relative flex flex-col items-center bg-white rounded-[24px] p-4 w-[450px] h-[418px] max-w-full shadow-lg">
        
        {/* Close Button Area (Frame 2608580 equivalent via absolute positioning) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-[#FF6B6B] hover:opacity-80 transition-opacity"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Wrapper to handle the 360px inner width and spacing */}
        <div className="flex flex-col items-center w-[360px] mt-2">
          
          {/* Header (Frame 2608578) */}
          <div className="flex flex-col items-center gap-2 mb-4 w-[328px]">
            <h2 className="text-[18px] font-medium text-black leading-[26px] text-center m-0">Transfer company ownership</h2>
            <p className="text-[12px] font-normal text-[#6B7280] leading-[16px] text-center m-0">
              Select a new owner for {companyName}
            </p>
            <p className="text-[12px] font-normal text-[#6B7280] leading-[16px] text-center m-0">
              Note: You can only transfer ownership to your followers
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full h-[40px] mb-4">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full rounded-[24px] border border-[#6B7280] pl-4 pr-10 text-[16px] text-[#6B7280] font-poppins focus:outline-none focus:border-[#6366F1]"
            />
            <Search className="absolute right-4 top-[10px] w-[18px] h-[18px] text-[#6B7280]" />
          </div>

          {/* Followers List (Frame 2609082) */}
          <div className="flex flex-col w-full gap-2 mb-4 h-[160px] overflow-y-auto pr-1">
            {mockFollowers.map(user => (
              <div key={user.id} className="flex items-center justify-between w-full h-[48px]">
                <div className="flex items-center gap-[9px]">
                  <div className="w-[32px] h-[32px] rounded-full bg-gray-200 overflow-hidden relative">
                    <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                  </div>
                  <span className="text-[16px] font-normal text-black leading-[24px]">{user.name}</span>
                </div>
                <label className="flex items-center justify-center p-1 w-[48px] h-[48px] cursor-pointer">
                  <div className="flex items-center justify-center w-[40px] h-[40px] rounded-full hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedUserId === user.id}
                      onChange={() => setSelectedUserId(user.id)}
                      className="w-[18px] h-[18px] rounded-[2px] border-[#6B7280] bg-white checked:bg-[#6366F1] checked:border-[#6366F1] cursor-pointer accent-[#6366F1]"
                    />
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Action Buttons (Frame 2608618) */}
          <div className="flex flex-row w-full gap-4 mt-auto">
            <button 
              onClick={onClose} 
              className="flex-1 flex items-center justify-center h-[40px] rounded-[24px] border border-[#6366F1] bg-white transition-colors hover:bg-indigo-50"
            >
              <span className="text-[14px] font-normal text-[#6366F1] leading-[20px] text-center">Cancel</span>
            </button>
            
            <button 
              onClick={() => {
                if (selectedUserId) onTransfer();
              }}
              disabled={!selectedUserId}
              className={`flex-1 flex items-center justify-center h-[40px] rounded-[24px] border border-white transition-colors ${
                selectedUserId ? 'bg-[#6366F1] hover:opacity-90' : 'bg-[#6366F1]/50 cursor-not-allowed'
              }`}
            >
              <span className="text-[14px] font-normal text-white leading-[20px] text-center">Transfer</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
