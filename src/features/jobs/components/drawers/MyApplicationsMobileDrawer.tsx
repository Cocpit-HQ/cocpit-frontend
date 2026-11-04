import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export interface MyApplicationsMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const STATUS_OPTIONS = ["All", "Applied", "Shortlisted", "In Review", "Declined"];
const DATE_OPTIONS = [
  { label: "Today", val: "today" },
  { label: "Last 7 days", val: "last 7 days" },
  { label: "Last 30 days", val: "last 30 days" },
];

export const MyApplicationsMobileDrawer: React.FC<MyApplicationsMobileDrawerProps> = ({
  isOpen,
  onClose,
  selectedStatus,
  setSelectedStatus,
  selectedDate,
  setSelectedDate,
}) => {
  const [tempStatus, setTempStatus] = useState<string>(selectedStatus);
  const [tempDate, setTempDate] = useState<string>(selectedDate);
  const [openSection, setOpenSection] = useState<"status" | "date" | null>("status");

  useEffect(() => {
    if (isOpen) {
      setTempStatus(selectedStatus);
      setTempDate(selectedDate);
      setOpenSection("status");
    }
  }, [isOpen, selectedStatus, selectedDate]);

  if (!isOpen) return null;

  const handleClear = () => {
    setTempStatus("All");
    setTempDate("All time");
  };

  const handleApply = () => {
    setSelectedStatus(tempStatus);
    setSelectedDate(tempDate);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 md:hidden"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[393px] mx-auto min-h-[424px] bg-ds-bg border-t border-x border-ds-border rounded-t-[8px] p-[8px_12px_24px] gap-4 flex flex-col items-center shadow-2xl animate-in slide-in-from-bottom duration-200 select-none"
      >
        {/* Frame 2608582: Drag Handle */}
        <div className="w-full h-5 flex flex-col items-center justify-center shrink-0">
          <div className="w-[50px] h-[3px] bg-ds-text-muted rounded-full" />
        </div>

        {/* Frame 2609314: Header */}
        <div className="w-full flex items-center justify-between h-9 px-1 shrink-0">
          <span className="font-dm-sans font-semibold text-base leading-6 text-white">
            Filter
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="font-dm-sans font-normal text-sm leading-5 text-ds-error hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none outline-none"
          >
            Clear
          </button>
        </div>

        {/* Frame 2610024: Accordion sections */}
        <div className="w-full flex flex-col gap-2 flex-1 overflow-y-auto no-scrollbar">
          {/* Section 1: Status */}
          <div className="w-full flex flex-col">
            <button
              type="button"
              onClick={() =>
                setOpenSection((prev) => (prev === "status" ? null : "status"))
              }
              className="w-full h-9 px-3 py-1.5 rounded-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none outline-none hover:bg-ds-surface-1 transition-colors"
            >
              <span className="font-dm-sans font-normal text-base leading-6 text-ds-text-primary">
                Status
              </span>
              <Icon
                icon={
                  openSection === "status"
                    ? "solar:alt-arrow-up-linear"
                    : "solar:alt-arrow-down-linear"
                }
                className="size-5 text-ds-text-primary shrink-0 transition-transform duration-200"
              />
            </button>

            {openSection === "status" && (
              <div className="w-full flex flex-col py-2 px-3 gap-4 animate-in fade-in duration-150">
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected =
                    tempStatus.toLowerCase() === opt.toLowerCase();
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTempStatus(opt)}
                      className={`text-left font-dm-sans text-sm leading-5 transition-colors cursor-pointer bg-transparent border-none outline-none ${
                        isSelected
                          ? "text-ds-accent font-medium"
                          : "text-ds-text-primary hover:text-ds-accent"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Date applied */}
          <div className="w-full flex flex-col">
            <button
              type="button"
              onClick={() =>
                setOpenSection((prev) => (prev === "date" ? null : "date"))
              }
              className="w-full h-9 px-3 py-1.5 rounded-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none outline-none hover:bg-ds-surface-1 transition-colors"
            >
              <span className="font-dm-sans font-normal text-base leading-6 text-ds-text-primary">
                Date applied
              </span>
              <Icon
                icon={
                  openSection === "date"
                    ? "solar:alt-arrow-up-linear"
                    : "solar:alt-arrow-down-linear"
                }
                className="size-5 text-ds-text-primary shrink-0 transition-transform duration-200"
              />
            </button>

            {openSection === "date" && (
              <div className="w-full flex flex-col py-2 px-3 gap-4 animate-in fade-in duration-150">
                {DATE_OPTIONS.map((item) => {
                  const isSelected = tempDate.toLowerCase() === item.val.toLowerCase();
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() =>
                        setTempDate(isSelected ? "All time" : item.val)
                      }
                      className={`text-left font-dm-sans text-sm leading-5 transition-colors cursor-pointer bg-transparent border-none outline-none ${
                        isSelected
                          ? "text-ds-accent font-medium"
                          : "text-ds-text-primary hover:text-ds-accent"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Frame 2610025: Footer Apply Button */}
        <div className="w-full flex justify-center items-center h-9 mt-auto pt-2 shrink-0">
          <button
            type="button"
            onClick={handleApply}
            className="w-[250px] h-9 px-3 py-1.5 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary font-dm-sans font-medium text-base leading-6 flex items-center justify-center cursor-pointer border-none outline-none transition-all shadow-md"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyApplicationsMobileDrawer;

