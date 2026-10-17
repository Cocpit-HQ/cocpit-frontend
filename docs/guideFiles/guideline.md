# Jobs UI & Company Profile Integration Guidelines

These rules dictate how the AI should handle modifications to the Jobs tab and Company profile UI in this workspace.

## 1. Shared UI Architecture (Do Not Disturb)
- **Single Component Strategy**: We use the exact same `MyListingsDashboard` component for BOTH the User's "Posted jobs" view and the Company Profile's "Jobs" view. 
- **NO Separate UI**: Do not create a separate `CompanyJobsPage`. The data service (`jobs.service.ts` -> `getMyListings`) is already configured to automatically route API requests to the Company API (`/organizations/${actorId}/jobs?scope=internal`) when a company profile is active.
- **Passing the State**: The `JobsPage` and `JobsTab` (in company profile) must pass `isCompanyMode={isCompanyMode}` or `isCompanyMode={true}` to `MyListingsDashboard` to trigger company-specific UI adjustments.

## 2. UI & Theming Rules
- **User Mode Colors**: When `isCompanyMode` is false (User mode), the UI strictly uses **Indigo** accents (`#6366F1`, `bg-indigo-50`, `bg-indigo-500`, etc.).
- **Company Mode Colors**: When `isCompanyMode` is true (Company mode), the UI strictly uses **Company Blue** accents (`#1A73E8`, `bg-blue-50`, `bg-blue-500`, etc.) to match the company branding.
- **Strict Separation**: **DO NOT** let company styles bleed into the user UI, and vice versa. Use conditional rendering logic like `isCompanyMode ? 'bg-[#1A73E8]' : 'bg-[#6366F1]'`.

## 3. Specific Component Rules
- **Back Button**: The back button `<` in the header of `MyListingsDashboard` must remain **hidden** when in company mode, but visible when in user mode.
- **Hero Banner Images**: The hero banner illustration uses two fixed graphics for both user and company modes. Do not revert to the placeholder `div` with lucide icons.
  - **Job Listings tab**: Uses `/images/companyonboarding/jobpostcompany.png`
  - **Sent Offers tab**: Uses `/images/companyonboarding/companyjoboffer.png`
- **Button Hover Effects**: The primary call-to-action buttons ("Create job" and "Send Offer") in the hero banner and empty states **must not** have background color hover effects (e.g., no `hover:bg-blue-700` or `hover:bg-indigo-600`). They should only have the `active:scale-95` press animation to ensure a clean look across both themes.

## 4. API & Services
- Any new features added to the Jobs dashboard must support both the standard user API (`/jobs/my`) and the company scope API. Ensure the `actorType` is checked in the service layer (`jobs.service.ts`) before making API calls.

## 5. Dark Mode Guidelines
All rules, color mappings, and logic for Dark Mode (for both User and Company views) have been moved to a dedicated file: `darkmodeguideline.md`.
When implementing any Dark Mode UI, please strictly refer to `darkmodeguideline.md`.

## 6. Next.js Routing Cache & Context State
- **Bypassing the Router Cache for Context:** Next.js App Router aggressively caches client-side navigations (RSC payloads). If a component heavily relies on a dynamic global context (like `useActiveProfile()` for switching between User and Company), DO NOT rely entirely on props passed down from a `page.tsx` file for critical state (e.g. `isCompanyMode`). 
- **Direct Hooking:** Components that render drastically different UI based on the active profile (like `JobsPage`) should hook directly into `useActiveProfile()` internally (e.g., `const { isCompany } = useActiveProfile();`) to ensure they instantly and correctly re-evaluate their state on mount, avoiding situations where the router cache serves a stale UI layout until the user performs a hard refresh.
