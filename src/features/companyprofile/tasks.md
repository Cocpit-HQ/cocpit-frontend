# Company Profile Implementation Tasks

## Phase 1: View Modes (Public & Own Profile)
- `[x]` Setup Folder Structure
    - `[x]` Create `components/view` folder
    - `[x]` Create `components/view/sections` folder
    - `[x]` Create `types` folder
- `[x]` Configure Global Styles
    - `[x]` Ensure `font-poppins` is available and applied to these components.
    - `[x]` Add custom tokens (e.g., `blue-600`) to Tailwind config if not already present.
- `[x]` Define Types (`types/company-profile.types.ts`)
    - `[x]` Add interfaces for company data, posts, people, and stats.
- `[x]` Create Base Layout (`components/view/CompanyProfilePage.tsx`)
    - `[x]` Implement `isOwnProfile` state/prop to manage view modes.
    - `[x]` Implement responsive container (`w-full max-w-[960px] mx-auto`).
    - `[x]` Ensure dark mode background classes (`bg-white dark:bg-zinc-950`).
- `[x]` Build Header Component (`components/view/CompanyProfileHeader.tsx`)
    - `[x]` Cover Image: Fallback to `/images/companyonboarding/companycoverphotoDefault.png`, 224px height.
    - `[x]` Profile Logo: Fallback to `/images/companyonboarding/companyprofileDefault.jpg`, 96x96px overlapping cover.
    - `[x]` Left alignment with `pl-4 sm:pl-10` spacing.
    - `[x]` Title (24px bold) + Verified Checkmark + Tagline (16px).
    - `[x]` Stats block (Following, Followers, Subscribers) right-aligned with blue-600 numbers.
    - `[x]` Action Buttons (overlapping cover right edge): "Edit page" (solid blue pill), "Share profile" (outline white pill).
- `[ ]` Build Tabs Component (`components/view/CompanyProfileTabs.tsx`)
    - `[ ]` Implement Radix UI Tabs for Home, About, Posts, Jobs, People.
    - `[ ]` Style active tab (blue-600, semibold, underline).
- `[x]` Build Sections (`components/view/sections/`)
    - `[x]` **AboutSection**: `rounded-xl`, 24px heading, `bg-blue-50` blockquote with `border-l-4 border-blue-800`.
    - `[x]` **CoreTeamSection** (`isOwnProfile` only): Two-column layout side-by-side with Verification Status Card (solid blue-600, rounded-2xl).
    - `[ ]` **PostsSection**: Grid layout, circular avatars, 2-line clamped caption, social icons row.
    - `[ ]` **PeopleSection**: Add connections preview UI.
    - `[ ]` **RelevanceSection**: Implement info bullets and Growth Trends chart.
    - `[ ]` **CommunitySection**: Build Newsletter subscription card.

## Phase 2: Edit Flow
- `[ ]` Setup Edit Folder Structure
- `[ ]` Create Base Edit Layout (`components/edit/EditCompanyPage.tsx`)
    - `[ ]` Implement header with Back button ("< Edit page") and helper text.
- `[ ]` Build Profile Edit Tab (`components/edit/EditProfileTab.tsx`)
- `[ ]` Build About Edit Tab (`components/edit/EditAboutTab.tsx`)
    - `[ ]` Implement dynamic Offices list (`useFieldArray`) & map placeholder.
    - `[ ]` Implement dynamic Links list (`useFieldArray`).
- `[ ]` Build Verification Edit Tab (`components/edit/EditVerificationTab.tsx`)

## Phase 3: Review & Refine
- `[ ]` Test Poppins font rendering and exact color matches (`blue-600`).
- `[ ]` Test mobile responsiveness across viewing and editing pages.
- `[ ]` Test dark mode styling for text readability (`gray-500` in light mode, `zinc-400` in dark mode).
