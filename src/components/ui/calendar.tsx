import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-[16px] bg-[#FFFFFF] border border-[#EEF2FF] rounded-[16px] w-[318px] relative", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        month_caption: "flex justify-center items-center h-[36px] mb-4 w-full",
        caption_label: "hidden",
        dropdowns: "flex justify-center gap-[8px] items-center",
        dropdown_root: "relative flex items-center bg-[#FFFFFF] border border-[#EEF2FF] rounded-[8px] h-[28px] focus-within:ring-1 focus-within:ring-[#6366F1]",
        dropdown: "appearance-none bg-transparent outline-none pr-6 pl-2 cursor-pointer text-[16px] font-normal font-['Inter'] text-[#000000] z-10 h-full w-full",
        vhidden: "sr-only",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-[36px] w-[36px] rounded-[32px] bg-transparent p-0 hover:bg-gray-100 absolute left-[16px] top-[16px] z-10 flex justify-center items-center"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-[36px] w-[36px] rounded-[32px] bg-transparent p-0 hover:bg-gray-100 absolute right-[16px] top-[16px] z-10 flex justify-center items-center"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex w-full",
        weekday: "text-[#6B7280] w-[40px] font-['Geist'] font-normal text-[12px] h-[20px] flex items-center justify-center",
        week: "flex w-full mt-[1px]",
        day: "h-[40px] w-[40px] flex items-center justify-center text-[16px] font-['Inter'] p-0 relative [&:has([aria-selected].range_end)]:rounded-r-[8px] [&:has([aria-selected].range_start)]:rounded-l-[8px] [&:has([aria-selected].outside)]:bg-[#EEF2FF]/50 [&:has([aria-selected])]:bg-[#EEF2FF] focus-within:relative focus-within:z-20",
        day_button: cn(buttonVariants({ variant: "ghost" }), "h-[40px] w-[40px] rounded-[8px] p-0 font-normal aria-selected:opacity-100 text-[#000000] hover:bg-gray-100"),
        range_start: "range_start bg-[#6366F1] text-[#FFFFFF] hover:bg-[#6366F1] hover:text-[#FFFFFF] focus:bg-[#6366F1] focus:text-[#FFFFFF]",
        range_end: "range_end bg-[#6366F1] text-[#FFFFFF] hover:bg-[#6366F1] hover:text-[#FFFFFF] focus:bg-[#6366F1] focus:text-[#FFFFFF]",
        selected:
          "bg-[#6366F1] text-[#FFFFFF] hover:bg-[#6366F1] hover:text-[#FFFFFF] focus:bg-[#6366F1] focus:text-[#FFFFFF]",
        today: "bg-accent text-accent-foreground",
        outside:
          "outside text-[#DADADA] opacity-100 aria-selected:bg-[#EEF2FF]/50 aria-selected:text-[#6B7280] aria-selected:opacity-100",
        disabled: "text-[#DADADA] opacity-100",
        range_middle: "aria-selected:bg-[#EEF2FF] aria-selected:text-[#000000]",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-[20px] w-[20px] text-[#000000]" strokeWidth={2} />;
          }
          if (props.orientation === 'right') {
            return <ChevronRight className="h-[20px] w-[20px] text-[#000000]" strokeWidth={2} />;
          }
          if (props.orientation === 'down') {
            return <ChevronDown className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[16px] w-[16px] opacity-100 pointer-events-none text-[#000000]" strokeWidth={2} />;
          }
          if (props.orientation === 'up') {
            return <ChevronUp className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[16px] w-[16px] opacity-100 pointer-events-none text-[#000000]" strokeWidth={2} />;
          }
          return null;
        },
      } as any}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
