# Dark Mode UI Guidelines

This document defines the color mappings and implementation logic for Dark Mode across the application. Since our application supports distinct visual themes for the **User** and **Company** experiences, the dark mode palette is also bifurcated.

## 1. Dark Mode Color Mapping (User View)
When implementing the Dark Mode UI for the **User section**, you must strictly follow this color palette mapping:

- **White / Background** (`#FFFFFF` in light) ➔ **Black** (`#0B0F19` in dark)
- **Black / Text** (`#000000` in light) ➔ **White** (`#F9FAFB` in dark)
- **Secondary text** (`#6B7280` in light) ➔ **Secondary text** (`#9CA3AF` in dark)
- **Error red** (`#FF6B6B` in light) ➔ **Error red** (`#F87171` in dark)
- **Success green** (`#22C55E` in light) ➔ **Success green** (`#4ADE80` in dark)
- **Warning yellow** (`#FBBF24` in light) ➔ **Warning yellow** (`#F59E0B` in dark)
- **Grey** (`#DADADA` in light) ➔ **Gray** (`#2E3445` in dark)
- **Primary** (`#6366F1` in light) ➔ **Primary** (`#818CF8` in dark)
- **Subtle** (`#C7D2FE` in light) ➔ **Subtle** (`#5B66D6` in dark)
- **Ultra light** (`#EEF2FF` in light) ➔ **Ultra light** (`#1C2340` in dark)
- **Light** (`#E0E7FF` in light) ➔ **Light** (`#252E54` in dark)
- **Button** (`#A5B4FC` in light) ➔ **Button** (`#6D79F4` in dark)
- **Button 2** (`#818CF8` in light) ➔ **Button 2** (`#818CF8` in dark)
- **Hover** (`#4F46E5` in light) ➔ **Hover** (`#6366F1` in dark)
- **Button 3** (`#4338CA` in light) ➔ **Button 3** (`#5B57D8` in dark)
- **Strong** (`#3730A3` in light) ➔ **Strong** (`#4C4DBF` in dark)
- **Deep accent** (`#312E81` in light) ➔ **Deep accent** (`#40449A` in dark)

## 2. Dark Mode Color Mapping (Company View)
When implementing the Dark Mode UI for the **Company section**, you must strictly follow this color palette mapping. For any given element, check what color it uses in light mode, and apply the corresponding dark mode color based on this chart:

- **Black / Text** (`#000000` in light) ➔ **White** (`#FFFFFF` in dark)
- **White / Background** (`#FFFFFF` in light) ➔ **Black** (`#0F1115` in dark)
- **Secondary** (`#6B7280` in light) ➔ **Secondary** (`#A1A8B3` in dark)
- **Grey** (`#E0E0E7` in light) ➔ **Grey** (`#2A2D35` in dark)
- **Primary** (`#1A73E8` in light) ➔ **Primary** (`#4D9CFF` in dark)
- **Primary dark** (`#0D47A1` in light) ➔ **Primary dark** (`#82B8FF` in dark)
- **Light primary** (`#E8F1FF` in light) ➔ **Light primary** (`#16365F` in dark)
- **Ultra light** (`#F2F7FF` in light) ➔ **Ultra light** (`#121B2B` in dark)
- **Light** (`#EFF4FF` in light) ➔ **Light** (`#1A2435` in dark)
- **Success** (`#22C55E` in light) ➔ **Success** (`#4ADE80` in dark)
- **Warning** (`#F59E0B` in light) ➔ **Warning** (`#FBBF24` in dark)
- **Error** (`#EF4444` in light) ➔ **Error** (`#F87171` in dark)
- **Light green** (`#DCFCE7` in light) ➔ **Light green** (`#123B23` in dark)
- **Light yellow** (`#FEF3C7` in light) ➔ **Light yellow** (`#4A3A10` in dark)
- **Light red** (`#FEE2E2` in light) ➔ **Light red** (`#4A1C1C` in dark)

## Implementation Strategy
- Use Tailwind dark mode classes (e.g., `dark:bg-[#0F1115]`) or dynamic logic so that the light mode UI is never disrupted. Always ensure the light mode defaults are preserved.
- For shared components (components used by both the User UI and Company UI), you must use conditional rendering based on an `isCompanyMode` boolean prop (or similar context).
  - Example: `` className={`text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`} ``
- Do not let company styles bleed into the user UI, and vice versa.
