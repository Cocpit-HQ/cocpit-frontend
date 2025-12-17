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
  Settings as SettingsIcon,
} from "lucide-react"

import SuggestionsPanel from "@/components/SuggestionsPanel"
import { AppShell } from "@/components/layout/AppShell"
import type { Page, Theme } from "@/types/common"

type SettingsSection = "appearance" | "notifications" | "privacy" | "account"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
  achievements: "/achievements",
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
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? "bg-[#5B7CFF]" : "bg-[#3d4558]"}`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? "translate-x-6" : "translate-x-0"
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
  isDark,
}: {
  icon: React.ReactNode
  title: string
  description: string
  isActive: boolean
  onClick: () => void
  isDark: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all ${
        isActive
          ? "bg-gradient-to-br from-[#5B7CFF] to-[#7B5CFF] border border-[#5B7CFF]"
          : isDark
            ? "bg-[#242b3d] border border-[#2d3548] hover:border-[#3d4558]"
            : "bg-white border border-[#E1E1E1] hover:border-[#0A66C2] shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`${isActive ? "text-white" : isDark ? "text-[#5B7CFF]" : "text-[#0A66C2]"}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`mb-1 ${isActive ? "text-white" : isDark ? "text-white" : "text-[#1A1A1A]"}`}>{title}</h3>
          <p className={`text-xs ${isActive ? "text-white/80" : isDark ? "text-gray-400" : "text-[#666666]"}`}>
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
  isDark,
}: {
  icon: React.ReactNode
  title: string
  description: string
  isSelected: boolean
  onClick: () => void
  isDark: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
        isSelected
          ? isDark
            ? "bg-[#1a1f2e] border-[#5B7CFF]"
            : "bg-[#EAF4FF] border-[#0A66C2]"
          : isDark
            ? "bg-[#1a1f2e] border-[#2d3548] hover:border-[#3d4558]"
            : "bg-[#F3F2EF] border-[#E1E1E1] hover:border-[#0A66C2]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`${
            isSelected
              ? isDark
                ? "text-[#5B7CFF]"
                : "text-[#0A66C2]"
              : isDark
                ? "text-gray-400"
                : "text-[#666666]"
          }`}
        >
          {icon}
        </div>
        <div className="text-left">
          <p className={isDark ? "text-white" : "text-[#1A1A1A]"}>{title}</p>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-[#666666]"}`}>{description}</p>
        </div>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          isSelected
            ? isDark
              ? "border-[#5B7CFF]"
              : "border-[#0A66C2]"
            : isDark
              ? "border-gray-600"
              : "border-[#CCCCCC]"
        }`}
      >
        {isSelected && <div className={`w-3 h-3 rounded-full ${isDark ? "bg-[#5B7CFF]" : "bg-[#0A66C2]"}`} />}
      </div>
    </button>
  )
}

function ToggleSetting({ title, description, isDark }: { title: string; description: string; isDark: boolean }) {
  const [checked, setChecked] = useState(true)

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <p className={`mb-1 ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>{title}</p>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-[#666666]"}`}>{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={() => setChecked(!checked)} />
    </div>
  )
}

function AccountSetting({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <p className={`text-sm mb-1 ${isDark ? "text-gray-400" : "text-[#666666]"}`}>{label}</p>
        <p className={isDark ? "text-white" : "text-[#1A1A1A]"}>{value}</p>
      </div>
      <button className={`text-sm hover:underline ${isDark ? "text-[#5B7CFF]" : "text-[#0A66C2]"}`}>Change</button>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const systemTheme = useSystemTheme()

  const effectiveTheme = resolvedTheme ?? (theme === "system" ? systemTheme : theme)
  const isDark = useMemo(() => effectiveTheme === "dark", [effectiveTheme])

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance")
  const [compactMode, setCompactMode] = useState(false)
  const [pendingTheme, setPendingTheme] = useState<Theme>(theme as Theme ?? "system")

  const handleSave = () => {
    setTheme(pendingTheme)
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <AppShell currentPage="settings" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
          <div className="mb-6 md:mb-8">
            <h1 className={`mb-2 ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>Settings</h1>
            <p className={isDark ? "text-gray-400" : "text-[#666666]"}>Manage your account preferences and privacy settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3">
              <div className="space-y-3">
                <SettingsNavCard
                  icon={<Palette className="w-5 h-5" />}
                  title="Appearance"
                  description="Customize your visual experience"
                  isActive={activeSection === "appearance"}
                  onClick={() => setActiveSection("appearance")}
                  isDark={isDark}
                />
                <SettingsNavCard
                  icon={<Bell className="w-5 h-5" />}
                  title="Notifications"
                  description="Manage notification preferences"
                  isActive={activeSection === "notifications"}
                  onClick={() => setActiveSection("notifications")}
                  isDark={isDark}
                />
                <SettingsNavCard
                  icon={<Lock className="w-5 h-5" />}
                  title="Privacy & Security"
                  description="Control how you share your information"
                  isActive={activeSection === "privacy"}
                  onClick={() => setActiveSection("privacy")}
                  isDark={isDark}
                />
                <SettingsNavCard
                  icon={<User className="w-5 h-5" />}
                  title="Account"
                  description="Manage your account settings"
                  isActive={activeSection === "account"}
                  onClick={() => setActiveSection("account")}
                  isDark={isDark}
                />
              </div>
            </div>

            <div className="lg:col-span-6">
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h2 className={`mb-2 ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>Appearance</h2>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-[#666666]"}`}>Customize your visual experience</p>
                  </div>

                  <div className={`rounded-xl p-6 ${isDark ? "bg-[#242b3d] border border-[#2d3548]" : "bg-white shadow-sm"}`}>
                    <h3 className={isDark ? "text-white mb-4" : "text-[#1A1A1A] mb-4"}>Theme</h3>

                    <div className="space-y-3">
                      <ThemeOption
                        icon={<Sun className="w-5 h-5" />}
                        title="Light Mode"
                        description="Clean and bright interface"
                        isSelected={pendingTheme === "light"}
                        onClick={() => setPendingTheme("light")}
                        isDark={isDark}
                      />
                      <ThemeOption
                        icon={<Moon className="w-5 h-5" />}
                        title="Dark Mode"
                        description="Easy on the eyes, perfect for night"
                        isSelected={pendingTheme === "dark"}
                        onClick={() => setPendingTheme("dark")}
                        isDark={isDark}
                      />
                      <ThemeOption
                        icon={<Monitor className="w-5 h-5" />}
                        title="System"
                        description="Follow your device's setting"
                        isSelected={pendingTheme === "system"}
                        onClick={() => setPendingTheme("system")}
                        isDark={isDark}
                      />
                    </div>
                  </div>

                  <div className={`rounded-xl p-6 ${isDark ? "bg-[#242b3d] border border-[#2d3548]" : "bg-white shadow-sm"}`}>
                    <h3 className={`mb-4 ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>Display</h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`mb-1 ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>Compact mode</p>
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-[#666666]"}`}>Show more content in less space</p>
                      </div>
                      <ToggleSwitch checked={compactMode} onChange={() => setCompactMode(!compactMode)} />
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className={`mb-2 ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>Notifications</h2>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-[#666666]"}`}>Manage notification preferences</p>
                  </div>

                  <div className={`rounded-xl p-6 space-y-4 ${isDark ? "bg-[#242b3d] border border-[#2d3548]" : "bg-white shadow-sm"}`}>
                    <ToggleSetting title="Email notifications" description="Receive email updates about your activity" isDark={isDark} />
                    <ToggleSetting title="Push notifications" description="Get notifications on your devices" isDark={isDark} />
                    <ToggleSetting title="Message notifications" description="Get notified about new messages" isDark={isDark} />
                    <ToggleSetting title="Job alerts" description="Receive notifications about job matches" isDark={isDark} />
                  </div>
                </div>
              )}

              {activeSection === "privacy" && (
                <div className="space-y-6">
                  <div>
                    <h2 className={`mb-2 ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>Privacy & Security</h2>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-[#666666]"}`}>Control how you share your information</p>
                  </div>

                  <div className={`rounded-xl p-6 space-y-4 ${isDark ? "bg-[#242b3d] border border-[#2d3548]" : "bg-white shadow-sm"}`}>
                    <ToggleSetting title="Profile visibility" description="Make your profile visible to everyone" isDark={isDark} />
                    <ToggleSetting title="Show activity status" description="Let others see when you're online" isDark={isDark} />
                    <ToggleSetting title="Search engine indexing" description="Allow search engines to show your profile" isDark={isDark} />
                  </div>
                </div>
              )}

              {activeSection === "account" && (
                <div className="space-y-6">
                  <div>
                    <h2 className={`mb-2 ${isDark ? "text-white" : "text-[#1A1A1A]"}`}>Account</h2>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-[#666666]"}`}>Manage your account settings</p>
                  </div>

                  <div className={`rounded-xl p-6 space-y-4 ${isDark ? "bg-[#242b3d] border border-[#2d3548]" : "bg-white shadow-sm"}`}>
                    <AccountSetting label="Email" value="alex.johnson@email.com" isDark={isDark} />
                    <AccountSetting label="Phone" value="+1 (555) 123-4567" isDark={isDark} />
                    <AccountSetting label="Password" value="••••••••" isDark={isDark} />
                    <AccountSetting label="Two-factor authentication" value="Disabled" isDark={isDark} />
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <div className="sticky top-8">
                <SuggestionsPanel theme={theme as Theme} />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}

