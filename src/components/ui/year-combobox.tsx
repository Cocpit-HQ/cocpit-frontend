"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const years = Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => 1950 + i).reverse()

interface YearComboboxProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function YearCombobox({ value, onChange, disabled }: YearComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || "Select year..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search year..." />
          <CommandList>
            <CommandEmpty>No year found.</CommandEmpty>
            <CommandGroup>
              {years.map((year) => (
                <CommandItem
                  key={year}
                  value={String(year)}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : String(year))
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === String(year) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {year}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
