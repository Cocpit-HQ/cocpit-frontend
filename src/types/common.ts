/**
 * Common Types used across the application
 */

export type Page = string;
export type Theme = "dark" | "light" | "system";

export type Status = "idle" | "loading" | "success" | "error";

export interface LoadingState {
  status: Status;
  error?: Error | null;
}

export interface AsyncState<T> extends LoadingState {
  data?: T;
}

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export interface PageProps<Params = Record<string, string>, SearchParams = Record<string, string>> {
  params: Params;
  searchParams: SearchParams;
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface AuthContext {
  user: Nullable<any>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface NotificationPayload {
  title: string;
  description: string;
  type?: "info" | "success" | "error" | "warning";
  duration?: number;
}
