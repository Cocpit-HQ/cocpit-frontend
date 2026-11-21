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
      className={cn("p-[12px] bg-ds-bg border border-ds-border rounded-[16px] shadow-2xl w-[260px] relative font-['DM_Sans']", className)}
      classNames={{
        months: "flex flex-col space-y-2 w-full",
        month: "space-y-2 w-full",
        month_caption: "flex justify-center items-center h-[28px] mb-2 w-full",
        caption_label: "hidden",
        dropdowns: "flex justify-center gap-[6px] items-center",
        dropdown_root: "relative flex items-center bg-ds-surface-1 border border-ds-border rounded-[6px] h-[26px] focus-within:ring-1 focus-within:ring-ds-accent",
        dropdown: "appearance-none bg-transparent outline-none pr-5 pl-2 cursor-pointer text-[12px] font-medium font-['DM_Sans'] text-ds-text-primary z-10 h-full w-full [&>option]:bg-ds-bg [&>option]:text-ds-text-primary",
        vhidden: "sr-only",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-[26px] w-[26px] rounded-full bg-transparent p-0 hover:bg-ds-surface-1 text-ds-text-primary absolute left-[8px] top-[12px] z-10 flex justify-center items-center transition-colors"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-[26px] w-[26px] rounded-full bg-transparent p-0 hover:bg-ds-surface-1 text-ds-text-primary absolute right-[8px] top-[12px] z-10 flex justify-center items-center transition-colors"
        ),
        month_grid: "w-full border-collapse space-y-0.5",
        weekdays: "flex w-full justify-between",
        weekday: "text-ds-text-secondary w-[32px] font-['DM_Sans'] font-medium text-[11px] h-[18px] flex items-center justify-center",
        week: "flex w-full justify-between mt-[1px]",
        day: "h-[32px] w-[32px] flex items-center justify-center text-[12px] font-['DM_Sans'] p-0 relative [&:has([aria-selected].range_end)]:rounded-r-[8px] [&:has([aria-selected].range_start)]:rounded-l-[8px] [&:has([aria-selected].outside)]:bg-ds-surface-1/40 [&:has([aria-selected])]:bg-ds-surface-1/60 focus-within:relative focus-within:z-20",
        day_button: cn(buttonVariants({ variant: "ghost" }), "h-[28px] w-[28px] rounded-[8px] p-0 font-normal aria-selected:opacity-100 text-ds-text-primary hover:bg-ds-surface-1 hover:text-ds-text-primary transition-colors text-[12px]"),
        range_start: "range_start bg-ds-surface-2 text-ds-text-primary hover:bg-ds-surface-2 hover:text-ds-text-primary focus:bg-ds-surface-2 focus:text-ds-text-primary font-medium rounded-[8px]",
        range_end: "range_end bg-ds-surface-2 text-ds-text-primary hover:bg-ds-surface-2 hover:text-ds-text-primary focus:bg-ds-surface-2 focus:text-ds-text-primary font-medium rounded-[8px]",
        selected:
          "bg-ds-surface-2 text-ds-text-primary hover:bg-ds-surface-2 hover:text-ds-text-primary focus:bg-ds-surface-2 focus:text-ds-text-primary font-medium rounded-[8px]",
        today: "text-ds-accent font-semibold",
        outside:
          "outside text-ds-text-muted/40 opacity-40 aria-selected:bg-ds-surface-1/40 aria-selected:text-ds-text-muted aria-selected:opacity-50",
        disabled: "text-ds-text-muted/40 opacity-40 cursor-not-allowed",
        range_middle: "aria-selected:bg-ds-surface-1/40 aria-selected:text-ds-text-primary font-normal",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-[20px] w-[20px] text-ds-text-primary" strokeWidth={2} />;
          }
          if (props.orientation === 'right') {
            return <ChevronRight className="h-[20px] w-[20px] text-ds-text-primary" strokeWidth={2} />;
          }
          if (props.orientation === 'down') {
            return <ChevronDown className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[16px] w-[16px] opacity-100 pointer-events-none text-ds-text-secondary" strokeWidth={2} />;
          }
          if (props.orientation === 'up') {
            return <ChevronUp className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[16px] w-[16px] opacity-100 pointer-events-none text-ds-text-secondary" strokeWidth={2} />;
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
