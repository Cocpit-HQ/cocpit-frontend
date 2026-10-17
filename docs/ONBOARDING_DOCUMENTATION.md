# Onboarding Module Documentation

## Overview
The onboarding module provides a two-step profile setup flow for new users after sign-in. It allows users to add a profile picture, choose a username, and optionally add a bio and phone number.

## Component Structure

```
src/components/onboarding/
├── OnboardingPage.tsx          # Main container managing state & navigation
├── OnboardingPage.module.css   # Container styles
├── ProfileStep.tsx             # Step 1: Profile picture & username
├── ProfileStep.module.css      # Step 1 styles
├── BioStep.tsx                 # Step 2: Bio & phone (optional)
└── BioStep.module.css          # Step 2 styles

src/app/onboarding/
└── page.tsx                    # Route handler
```

## Components

### OnboardingPage
**Main container component** that manages the multi-step flow and state.

**Features:**
- Manages step navigation (1 → 2)
- Centralizes profile data state
- Handles completion (currently logs data, future: database integration)
- Bridges between ProfileStep and BioStep

**Props:** None (root component)

**State Management:**
```typescript
{
  currentStep: 1 | 2,
  profileData: {
    profileImage: string | null,      // Base64 encoded image
    accountName: string,               // Username
    bio: string,                       // Optional
    phoneNumber: string,               // Optional
  }
}
```

---

### ProfileStep
**Step 1: Profile Setup** - Upload picture and select username.

**Features:**
- 📷 Image upload with preview
- ✓ Real-time username availability checking
- 🎯 Validation feedback (success/error states)
- 📱 Responsive design matching the design mock

**Props:**
```typescript
interface ProfileStepProps {
  onComplete: (data: { 
    profileImage: string | null; 
    accountName: string 
  }) => void;
  initialData: {
    profileImage: string | null;
    accountName: string;
  };
}
```

**Validation Rules:**
- Account name: 3-20 chars, alphanumeric + underscore, must start with letter
- Availability check: Mock validation (future: API call)

**UI Elements:**
- Image upload button with drag-n-drop style
- Account name input field
- "Check availability" button
- Status indicators (✓ Available / ✗ Not Available)
- "Next" button (disabled until name is available)

---

### BioStep
**Step 2: Bio & Contact** - Optional bio and phone verification.

**Features:**
- 📝 Bio textarea with character counter (500 max)
- 📱 Phone number input with validation
- ◀️ Back button to return to Step 1
- 📊 Progress bar indicator
- ℹ️ Helpful tooltips

**Props:**
```typescript
interface BioStepProps {
  onComplete: (data: { 
    bio: string; 
    phoneNumber: string 
  }) => void;
  onBack: () => void;
  initialData: {
    bio: string;
    phoneNumber: string;
  };
}
```

**Validation Rules:**
- Bio: Optional, max 500 characters
- Phone: Optional, but if provided must be 10+ digits with valid format

**UI Elements:**
- Bio textarea with character count feedback
- Phone input with icon and error messages
- Back button with progress bar
- Complete Profile button
- Info box with usage hints

---

## Styling

All components use **CSS Modules** with design tokens for consistency.

**Design Tokens Used:**
- `--color-primary` - Purple gradient buttons
- `--color-foreground` - Text color
- `--color-bg` - Background color
- `--color-border` - Border color
- `--color-muted` - Muted text color
- `--gradient-primary` - Purple gradient
- `--radius-md` - Border radius

**Responsive Design:**
- Desktop: 2-column layout (brand panel + form)
- Mobile: Single column with form only
- Breakpoints: 768px and 640px

---

## User Flow

```
Login Page
    ↓
[Sign In] → Redirects to /onboarding
    ↓
┌─────────────────────────────────────┐
│  STEP 1: ProfileStep                │
│  - Upload profile picture           │
│  - Enter account name               │
│  - Check availability               │
│  - [Next] → goes to Step 2          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  STEP 2: BioStep                    │
│  - Enter bio (optional)             │
│  - Enter phone (optional)           │
│  - [Back] → back to Step 1          │
│  - [Complete Profile] → finish      │
└─────────────────────────────────────┘
    ↓
Complete → Alert (static for now)
         → Future: Save to database & redirect to dashboard
```

---

## Integration Points

### Current State (Static)
- User data is logged to console
- No database integration
- Alert shows "Profile setup complete!"
- Ready for UI testing and refinement

### Future Enhancements
```typescript
// Replace this in OnboardingPage.tsx handleBioComplete():
// Current:
console.log("Onboarding completed:", {...});
alert("Profile setup complete!");

// Future:
// 1. Call API to save profile data
const response = await fetch('/api/auth/profile', {
  method: 'POST',
  body: JSON.stringify(profileData),
});

// 2. Store session/auth tokens
// 3. Redirect to dashboard
router.push('/dashboard');
```

### Database Schema (Future)
```sql
-- User Profile Table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY,
  profile_image_url VARCHAR,
  account_name VARCHAR UNIQUE,
  bio TEXT,
  phone_number VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Testing Checklist

- [ ] Upload profile image and verify preview
- [ ] Test account name validation (3+ chars, alphanumeric)
- [ ] Check availability feature
- [ ] Navigate back and forth between steps
- [ ] Verify optional fields can be skipped
- [ ] Test phone number validation
- [ ] Test bio character limit (500)
- [ ] Verify responsive design on mobile
- [ ] Test form submission and data logging

---

## CSS Modules Classes Reference

### OnboardingPage.module.css
- `.container` - Full viewport container
- `.wrapper` - Content wrapper

### ProfileStep.module.css
- `.container` - Grid layout (2 cols)
- `.brandPanel` - Left side branding
- `.formPanel` - Right side form
- `.uploadButton` - Image upload button
- `.input` - Form inputs
- `.nextBtn` - Next button
- `.checkBtn` - Availability check button

### BioStep.module.css
- `.container` - Full screen container
- `.content` - Content wrapper
- `.textarea` - Bio textarea
- `.input` - Phone input
- `.completeBtn` - Complete button
- `.progressBar` - Progress indicator
- `.backBtn` - Back button

---

## Code Examples

### Using the Onboarding Page
```tsx
import OnboardingPage from '@/components/onboarding/OnboardingPage';

export default function Page() {
  return <OnboardingPage />;
}
```

### Accessing Route
```
Visit: http://localhost:3000/onboarding
```

### Custom Redirects
```tsx
// In any component:
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/onboarding');
```

---

## Notes

- **Static for Now:** All data is logged to console and shown in alert
- **Future Database:** Replace console.log with API calls to save data
- **Image Storage:** Currently Base64 strings; future use CDN/cloud storage
- **Phone Validation:** Simple regex validation; future use proper tel library
- **Availability Check:** Mock validation; future call username API endpoint

---

## Support

For questions or updates to the onboarding flow, refer to:
- Component files in `src/components/onboarding/`
- CSS Module files for styling customization
- `docs/STYLING_GUIDELINES.md` for CSS Modules patterns
