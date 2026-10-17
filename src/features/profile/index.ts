export { default as ProfilePage } from './pages/ProfilePage';
export { default as PublicPostsPage } from './pages/PublicPostsPage';
export * from './types/profile.types';
export * from './services/profile.service';
export * from './hooks/useProfile';
export * from './hooks/useProfilePosts';
export { ProfileProjects } from './commonProfileComponents/ProfileProjects';
export { default as AddProjectForm } from './components/AddProjectForm';
export * from './components/profile-edit';
export { ProfileAllPostsScreen } from './components/ProfileAllPostsScreen';
export * from './components/ProfileScoreCard';

// Resolve naming collision for DropdownOption between services and profile-edit
export type { DropdownOption } from './services/profile.service';
