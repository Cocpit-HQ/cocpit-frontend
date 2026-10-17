import React, { useState } from "react";
import { Experience } from "@/types/entities";
import { X, Building2 } from "lucide-react";

interface RoleSelectionPopupProps {
  roles: Experience[];
  onSelect: (role: Experience) => void;
  onClose: () => void;
  logoUrl?: string | null;
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

function CompanyAvatar({ logoUrl, companyName }: { logoUrl?: string | null; companyName: string }) {
  const [imgError, setImgError] = useState(false);

  if (logoUrl && !imgError) {
    return (
      <div className="flex flex-row justify-center items-center w-[48px] h-[48px] rounded-[12px] overflow-hidden flex-none bg-white border border-[#E5E7EB] mt-1">
        <img
          src={logoUrl}
          alt={companyName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-row justify-center items-center w-[48px] h-[48px] rounded-[12px] overflow-hidden flex-none bg-[#EEF2FF] mt-1">
      <Building2 className="w-6 h-6 text-[#6366F1]" strokeWidth={1.5} />
    </div>
  );
}

export function RoleSelectionPopup({ roles, onSelect, onClose, logoUrl }: RoleSelectionPopupProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="w-[552px] rounded-[24px] bg-card p-4 shadow-lg relative flex flex-col items-center">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 hover:opacity-80 transition-opacity"
        >
          <X className="w-5 h-5 text-[#FF6B6B]" strokeWidth={2} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 w-full mt-2 mb-4">
          <h2 className="text-[18px] leading-[26px] font-medium text-foreground font-['DM_Sans']">
            Select experience to edit
          </h2>
          <p className="text-[12px] leading-[16px] text-[#6B7280] font-normal font-['DM_Sans']">
            Choose the role you want to update
          </p>
        </div>

        {/* Role List */}
        <div className="flex flex-col gap-4 w-full">
          {roles.map((role) => (
            <div
              key={role.experience_id}
              onClick={() => onSelect(role)}
              className="flex items-start gap-2 px-4 py-3 w-full min-h-[64px] h-auto rounded-[12px] cursor-pointer hover:bg-[#EEF2FF] transition-colors border border-transparent"
            >
              {/* Logo Section */}
              <CompanyAvatar logoUrl={logoUrl} companyName={role.company_name} />

              {/* Text Info */}
              <div className="flex flex-row justify-between items-start flex-1 ml-2 min-w-0">
                <div className="flex flex-col gap-1 flex-1 min-w-0 mr-4">
                  <p className="text-[16px] leading-[24px] font-medium text-foreground font-['DM_Sans'] text-center w-full sm:w-auto sm:text-left break-words">
                    {role.title}
                  </p>
                  <p className="text-[12px] leading-[16px] text-[#6B7280] font-normal font-['DM_Sans'] break-words">
                    {role.company_name}
                  </p>
                </div>

                <div className="flex flex-row items-center gap-2 flex-shrink-0 whitespace-nowrap mt-1">
                  <span className="text-[12px] leading-[16px] text-[#6B7280] font-normal font-['DM_Sans']">
                    {formatDate(role.start_date)}
                  </span>
                  <span className="text-[12px] leading-[16px] text-[#6B7280] font-normal font-['DM_Sans'] text-center w-[9px]">
                    -
                  </span>
                  <span className="text-[12px] leading-[16px] text-[#6B7280] font-normal font-['DM_Sans']">
                    {role.end_date ? formatDate(role.end_date) : "Present"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
