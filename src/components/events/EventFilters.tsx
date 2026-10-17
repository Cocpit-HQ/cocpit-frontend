"use client"

import React from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface FilterState {
  categories: string[];
  types: string[];
  prices: string[];
  dates: string[];
  popular: boolean;
}

export const initialFilterState: FilterState = {
  categories: [],
  types: [],
  prices: [],
  dates: [],
  popular: false
}

interface EventFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export function EventFilters({ filters, setFilters }: EventFiltersProps) {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleCheckboxChange = (
    category: keyof FilterState,
    value: string,
    checked: boolean
  ) => {
    setFilters((prev) => {
      if (category === 'popular') {
        return { ...prev, popular: checked }
      }

      const currentList = prev[category] as string[];
      let newList;
      if (checked) {
        newList = [...currentList, value];
      } else {
        newList = currentList.filter((item) => item !== value);
      }
      return { ...prev, [category]: newList };
    });
  };

  const clearAll = () => {
    setFilters(initialFilterState);
  }

  const FilterList = () => (
    <div className="grid gap-6 p-4">
      {/* Event Type */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-foreground">Event Type</h4>
        <div className="grid gap-2">
          {['Online', 'InPerson'].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.types.includes(type)}
                onCheckedChange={(checked) => handleCheckboxChange('types', type, checked as boolean)}
              />
              <Label htmlFor={`type-${type}`} className="text-sm font-normal cursor-pointer">
                {type === 'InPerson' ? 'In-person' : type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-foreground">Price</h4>
        <div className="grid gap-2">
          {['Free', 'Paid'].map((price) => (
            <div key={price} className="flex items-center space-x-2">
              <Checkbox
                id={`price-${price}`}
                checked={filters.prices.includes(price)}
                onCheckedChange={(checked) => handleCheckboxChange('prices', price, checked as boolean)}
              />
              <Label htmlFor={`price-${price}`} className="text-sm font-normal cursor-pointer">
                {price}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-foreground">Category</h4>
        <div className="grid gap-2">
          {['Tech', 'Business', 'Networking', 'Workshop', 'Summit', 'Conference', 'Masterclass'].map((cat) => (
            <div key={cat} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat}`}
                checked={filters.categories.includes(cat)}
                onCheckedChange={(checked) => handleCheckboxChange('categories', cat, checked as boolean)}
              />
              <Label htmlFor={`cat-${cat}`} className="text-sm font-normal cursor-pointer">
                {cat}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-foreground">Date</h4>
        <div className="grid gap-2">
          {['Today', 'This Week', 'This Month'].map((date) => (
            <div key={date} className="flex items-center space-x-2">
              <Checkbox
                id={`date-${date}`}
                checked={filters.dates.includes(date)}
                onCheckedChange={(checked) => handleCheckboxChange('dates', date, checked as boolean)}
              />
              <Label htmlFor={`date-${date}`} className="text-sm font-normal cursor-pointer">
                {date}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Popularity */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-foreground">Popularity</h4>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="pop-popular"
            checked={filters.popular}
            onCheckedChange={(checked) => handleCheckboxChange('popular', 'true', checked as boolean)}
          />
          <Label htmlFor="pop-popular" className="text-sm font-normal cursor-pointer">
            Popular Events
          </Label>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={clearAll} className="w-full mt-2">
        Clear All Filters
      </Button>
    </div>
  )

  if (mounted && isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 bg-card border-border text-foreground rounded-full">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 border-b font-semibold">Filters</div>
          <div className="max-h-[60vh] overflow-y-auto">
            <FilterList />
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="default" className="gap-2 bg-card border-border text-foreground px-4 rounded-full">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[70vh] overflow-y-auto px-4">
          <FilterList />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}
