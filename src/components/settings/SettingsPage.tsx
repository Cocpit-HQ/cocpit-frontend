"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Palette,
  Bell,
  Lock,
  User,
  Monitor,
  Sun,
  Moon,
  ArrowLeft,
  Settings as SettingsIcon,
  Zap,
  LogOut,
  Ban,
  Trash2,
  Building,
  Bookmark,
} from "lucide-react"

import BlockedUsersPage from "@/app/(dashboard)/settings/blocked/page"
import ActiveSessions from "@/components/settings/ActiveSessions"
import { deleteAccount } from "@/services/api/user"
import { toast } from "sonner"


import { SavedPosts } from "./SavedPosts"
import SuggestionsPanel from "@/components/home/SuggestionsPanel"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Page, Theme } from "@/types/common"
import { useActiveProfile } from "@/context/ActiveProfileContext"

type SettingsSection = "appearance" | "notifications" | "privacy" | "account" | "blocked" | "sessions" | "companies" | "saved"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<Theme>("light")

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const updateTheme = (matches: boolean) => setSystemTheme(matches ? "dark" : "light")
    updateTheme(mediaQuery.matches)
    const listener = (event: MediaQueryListEvent) => updateTheme(event.matches)
    mediaQuery.addEventListener("change", listener)
    return () => mediaQuery.removeEventListener("change", listener)
  }, [])

  return systemTheme
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-secondary"}`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-6" : "translate-x-0"
          }`}
      />
    </button>
  )
}

function SettingsNavCard({
  icon,
  title,
  description,
  isActive,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all border ${isActive
        ? "bg-primary border-primary"
        : "bg-card border-border hover:border-secondary shadow-sm"
        }`}
    >
      <div className="flex items-start gap-3">
        <div className={`${isActive ? "text-primary-foreground" : "text-primary"}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`mb-1 ${isActive ? "text-primary-foreground" : "text-foreground"}`}>{title}</h3>
          <p className={`text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}

function ThemeOption({
  icon,
  title,
  description,
  isSelected,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${isSelected
        ? "bg-sidebar border-primary"
        : "bg-sidebar border-sidebar-border hover:border-secondary"
        }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`${isSelected
            ? "text-primary"
            : "text-muted-foreground"
            }`}
        >
          {icon}
        </div>
        <div className="text-left">
          <p className="text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected
          ? "border-primary"
          : "border-muted-foreground"
          }`}
      >
        {isSelected && <div className="w-3 h-3 rounded-full bg-primary" />}
      </div>
    </button>
  )
}

function ToggleSetting({ title, description }: { title: string; description: string }) {
  const [checked, setChecked] = useState(true)

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <p className="mb-1 text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={() => setChecked(!checked)} />
    </div>
  )
}

function AccountSetting({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <p className="text-sm mb-1 text-muted-foreground">{label}</p>
        <p className="text-foreground">{value}</p>
      </div>
      <button className="text-sm hover:underline text-primary">Change</button>
    </div>
  )
}

import { useUserCompanies } from "@/components/organizations/hooks/use-company"
import Link from "next/link"
import { Plus } from "lucide-react"

function CompaniesSettings() {
  const { data: companies, isLoading } = useUserCompanies()
  const router = useRouter()

  if (isLoading) return <div className="p-8 text-center">Loading companies...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-foreground">Companies</h2>
          <p className="text-sm text-muted-foreground">Manage the companies you own or belong to</p>
        </div>
        <Button onClick={() => router.push('/create-organization')}>
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
      </div>

      <div className="grid gap-4">
        {companies && companies.length > 0 ? (
          companies.map((company) => (
            <div key={company.org_id || company.company_id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-lg font-bold">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    company.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{company.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{company.role?.toLowerCase() || 'Member'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/organization/${company.slug}/settings`}>
                    Settings
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/organization/${company.slug}`}>
                    View Page
                  </Link>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border border-dashed rounded-xl">
            <p className="text-muted-foreground mb-4">You haven't created or joined any companies yet.</p>
            <Button variant="outline" onClick={() => router.push('/create-organization')}>
              Create your first company
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { activeProfile } = useActiveProfile()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const systemTheme = useSystemTheme()
  const { logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")
  const isMobile = useIsMobile()

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance")
  const [compactMode, setCompactMode] = useState(false)

  // Mobile navigation state
  const [showMobileDetail, setShowMobileDetail] = useState(false)

  // Fix hydration mismatch: Initialize with a deterministic value
  const [pendingTheme, setPendingTheme] = useState<Theme>("navy")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (theme) {
      setPendingTheme(theme as Theme)
    }
  }, [theme])

  const handleSave = () => {
    setTheme(pendingTheme)
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    if (!deletePassword) {
      toast.error("Please enter your password to confirm")
      return
    }

    try {
      setIsDeleting(true)
      await deleteAccount(deletePassword)
      toast.success("Account deleted successfully")
      await logout()
      router.push("/")
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to delete account"
      toast.error(errorMessage)
      setIsDeleting(false)
    }
  }

  const handleBack = () => {
    if (isMobile && showMobileDetail) {
      setShowMobileDetail(false)
    } else {
      router.push("/profile")
    }
  }

  const handleSectionClick = (section: SettingsSection) => {
    setActiveSection(section)
    if (isMobile) {
      setShowMobileDetail(true)
    }
  }

  const showNav = !isMobile || !showMobileDetail
  const showContent = !isMobile || showMobileDetail

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
        <div className="mb-6 md:mb-8 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-full transition-all hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="mb-2 text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              {isMobile && showMobileDetail ? "Manage your account preferences" : "Manage your account preferences and privacy settings"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {showNav && (
            <div className="lg:col-span-3">
              <div className="space-y-3">
                <SettingsNavCard
                  icon={<Palette className="w-5 h-5" />}
                  title="Appearance"
                  description="Customize your visual experience"
                  isActive={activeSection === "appearance"}
                  onClick={() => handleSectionClick("appearance")}
                />
                <SettingsNavCard
                  icon={<Bookmark className="w-5 h-5" />}
                  title="Saved Posts"
                  description="View and manage your saved content"
                  isActive={activeSection === "saved"}
                  onClick={() => handleSectionClick("saved")}
                />
                <SettingsNavCard
                  icon={<Bell className="w-5 h-5" />}
                  title="Notifications"
                  description="Manage notification preferences"
                  isActive={activeSection === "notifications"}
                  onClick={() => handleSectionClick("notifications")}
                />
                <SettingsNavCard
                  icon={<Lock className="w-5 h-5" />}
                  title="Privacy & Security"
                  description="Control how you share your information"
                  isActive={activeSection === "privacy"}
                  onClick={() => handleSectionClick("privacy")}
                />
                <SettingsNavCard
                  icon={<User className="w-5 h-5" />}
                  title="Account"
                  description="Manage your account settings"
                  isActive={activeSection === "account"}
                  onClick={() => handleSectionClick("account")}
                />
                <SettingsNavCard
                  icon={<Building className="w-5 h-5" />}
                  title="Companies"
                  description="Manage your company pages"
                  isActive={activeSection === "companies"}
                  onClick={() => handleSectionClick("companies")}
                />
                <SettingsNavCard
                  icon={<Ban className="w-5 h-5" />}
                  title="Blocked Users"
                  description="Manage blocked accounts"
                  isActive={activeSection === "blocked"}
                  onClick={() => handleSectionClick("blocked")}
                />
                <SettingsNavCard
                  icon={<Monitor className="w-5 h-5" />}
                  title="Active Sessions"
                  description="Manage your logged-in devices"
                  isActive={activeSection === "sessions"}
                  onClick={() => handleSectionClick("sessions")}
                />
              </div>
            </div>
          )}

          {showContent && (
            <div className="lg:col-span-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {activeSection === "saved" && (
                <div className="space-y-6">
                  <SavedPosts />
                </div>
              )}
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-2 text-foreground">Appearance</h2>
                    <p className="text-sm text-muted-foreground">Customize your visual experience</p>
                  </div>

                  <div className="rounded-xl p-6 bg-card border border-border">
                    <h3 className="text-foreground mb-4">Theme</h3>

                    <div className="space-y-3">
                      <ThemeOption
                        icon={<Zap className="w-5 h-5" />}
                        title="Navy Mode"
                        description="The classic experience"
                        isSelected={pendingTheme === "navy"}
                        onClick={() => setPendingTheme("navy")}
                      />
                      <ThemeOption
                        icon={<Sun className="w-5 h-5" />}
                        title="Light Mode"
                        description="Clean and bright interface"
                        isSelected={pendingTheme === "light"}
                        onClick={() => setPendingTheme("light")}
                      />
                      <ThemeOption
                        icon={<Moon className="w-5 h-5" />}
                        title="Dark Mode"
                        description="Easy on the eyes, perfect for night"
                        isSelected={pendingTheme === "dark"}
                        onClick={() => setPendingTheme("dark")}
                      />
                      <ThemeOption
                        icon={<Monitor className="w-5 h-5" />}
                        title="System"
                        description="Follow your device's setting"
                        isSelected={pendingTheme === "system"}
                        onClick={() => setPendingTheme("system")}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl p-6 bg-card border border-border">
                    <h3 className="mb-4 text-foreground">Display</h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-foreground">Compact mode</p>
                        <p className="text-sm text-muted-foreground">Show more content in less space</p>
                      </div>
                      <ToggleSwitch checked={compactMode} onChange={() => setCompactMode(!compactMode)} />
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-2 text-foreground">Notifications</h2>
                    <p className="text-sm text-muted-foreground">Manage notification preferences</p>
                  </div>

                  <div className="rounded-xl p-6 space-y-4 bg-card border border-border">
                    <ToggleSetting title="Email notifications" description="Receive email updates about your activity" />
                    <ToggleSetting title="Push notifications" description="Get notifications on your devices" />
                    <ToggleSetting title="Message notifications" description="Get notified about new messages" />
                    <ToggleSetting title="Job alerts" description="Receive notifications about job matches" />
                  </div>
                </div>
              )}

              {activeSection === "privacy" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-2 text-foreground">Privacy & Security</h2>
                    <p className="text-sm text-muted-foreground">Control how you share your information</p>
                  </div>

                  <div className="rounded-xl p-6 space-y-4 bg-card border border-border">
                    <ToggleSetting title="Profile visibility" description="Make your profile visible to everyone" />
                    <ToggleSetting title="Show activity status" description="Let others see when you're online" />
                    <ToggleSetting title="Search engine indexing" description="Allow search engines to show your profile" />
                  </div>
                </div>
              )}

              {activeSection === "account" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-2 text-foreground">Account</h2>
                    <p className="text-sm text-muted-foreground">Manage your account settings</p>
                  </div>

                  <div className="rounded-xl p-6 space-y-4 bg-card border border-border">
                    <AccountSetting label="Email" value="alex.johnson@email.com" />
                    <AccountSetting label="Phone" value="+1 (555) 123-4567" />
                    <AccountSetting label="Password" value="••••••••" />
                    <AccountSetting label="Two-factor authentication" value="Disabled" />

                    <div className="pt-4 border-t border-border">
                      <p className="text-sm mb-1 text-muted-foreground">Session</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        End your current session on this device.
                      </p>
                      <Button
                        variant="outline"
                        className="text-foreground border-border hover:bg-muted w-full md:w-auto"
                        onClick={() => setShowLogoutModal(true)}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log out
                      </Button>
                    </div>

                    <div className="pt-6 mt-6 border-t border-border">
                      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                        <p className="text-sm text-muted-foreground mb-4">
                          Deleting your account permanently removes your profile and related data. This action cannot be undone.
                        </p>
                        <Button
                          variant="destructive"
                          className="w-full md:w-auto"
                          onClick={() => {
                            setDeleteConfirmationText("")
                            setShowDeleteModal(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeSection === "companies" && (
                <CompaniesSettings />
              )}
              {activeSection === "blocked" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="mb-2 text-foreground">Blocked Users</h2>
                    <p className="text-sm text-muted-foreground">Manage the users you have blocked</p>
                  </div>
                  <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <BlockedUsersPage />
                  </div>
                </div>
              )}
              {activeSection === "sessions" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <ActiveSessions />
                </div>
              )}
            </div>
          )}

          <div className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-8">
              <SuggestionsPanel />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You will be redirected to the sign-in page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout}>
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Account?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-left space-y-2 pt-2">
                <p>This action is <span className="font-bold text-destructive">permanent and irreversible</span>.</p>
                <p>All your profile data, connections, and settings will be removed from Cocpit permanently. Your messages will be anonymized but not removed.</p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                To confirm, type <span className="font-bold italic">DELETE</span> below:
              </label>
              <input
                type="text"
                className="w-full p-2.5 rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all"
                placeholder="Type DELETE"
                autoFocus
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Enter your password:
              </label>
              <input
                type="password"
                className="w-full p-2.5 rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition-all"
                placeholder="Your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmationText !== "DELETE"}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
