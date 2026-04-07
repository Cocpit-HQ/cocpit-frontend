"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  Laptop, 
  Image as ImageIcon, 
  Network, 
  ShieldAlert,
  ChevronRight,
  Globe,
  MapPin,
  Users,
  Save,
  Trash2,
  AlertTriangle,
  Zap,
  Plus
} from 'lucide-react'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { useCompany } from '@/hooks/useOrganization'
import { EditOrganizationForm } from '@/components/organizations/EditOrganizationForm'
import { OrganizationTechStack } from '@/components/organizations/organization-tech-stack'
import { OrganizationGallery } from '@/components/organizations/organization-gallery'
import { OrgSubOrganizations } from '@/components/organizations/OrgSubOrganizations'
import { OrganizationSettings } from '@/components/organizations/OrganizationSettings'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type TabID = 'profile' | 'tech' | 'gallery' | 'hierarchy' | 'danger'

export default function MyCompanyPage() {
  const { activeProfile } = useActiveProfile()
  const { data: company, isLoading } = useCompany(activeProfile?.slug || '')
  const [activeTab, setActiveTab] = useState<TabID>('profile')

  const MOCK_COMPANY = {
    id: 'mock-1',
    company_id: 'mock-1',
    name: activeProfile?.name || 'Your Enterprise Name',
    slug: activeProfile?.slug || 'your-enterprise',
    location: 'London, UK',
    member_count: 1,
    avatar_url: '',
    industry: 'Technology',
    description: 'This is a mock description for UI exploration purposes.'
  }

  const displayCompany = (company || MOCK_COMPANY) as any

  if (isLoading) {
    return (
      <div className="space-y-10 animate-pulse">
        <div className="h-10 w-64 bg-white/5 rounded-full" />
        <div className="h-[600px] bg-white/5 rounded-[40px]" />
      </div>
    )
  }

  const tabs: { id: TabID; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: Building2 },
    { id: 'tech', label: 'Tech Stack', icon: Laptop },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'hierarchy', label: 'Hierarchy', icon: Network },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert },
  ]

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 pb-20">
      {/* Header & Tabs Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-[#818cf8]/10 border border-[#818cf8]/20">
                <Building2 className="w-5 h-5 text-[#818cf8]" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tight uppercase tracking-widest">My Company</h1>
          </div>
          <p className="text-slate-400 font-bold tracking-tight opacity-70 ml-1">Manage your professional ecosystem identity.</p>
        </div>

        <div className="flex items-center p-1.5 rounded-2xl bg-[#0a0f1d]/60 border border-white/5 backdrop-blur-md">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                  isActive 
                    ? "bg-[#818cf8] text-white shadow-lg shadow-[#818cf8]/20" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-600")} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="rounded-[40px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl p-10 relative overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#818cf8]/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 blur-[120px] pointer-events-none" />

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12 relative z-10">
              <div className="space-y-8">
                <div className="pb-6 border-b border-white/5">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest mb-2">Core Identity</h3>
                  <p className="text-xs text-slate-500 font-medium">This information is visible to the entire Cocpit professional network.</p>
                </div>
                
                {/* We wrap the existing form but it might need some internal CSS overrides if it uses standard light-themed components.
                    Assuming standard cocpit components are dark-theme aware (shadcn usually is). */}
                <div className="cockpit-form-wrapper">
                  <EditOrganizationForm company={displayCompany} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black text-[#818cf8] uppercase tracking-widest">Public Visibility</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span>cocpit.ai/org/{displayCompany.slug}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{displayCompany.location || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>{displayCompany.member_count} active members</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4 h-11 rounded-xl bg-white/5 border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all hover:bg-[#818cf8] hover:border-[#818cf8]">
                    View Public Profile
                  </Button>
                </div>

                <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-[#818cf8]" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Optimization Tip</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Companies with complete "Life at" galleries receive 3x more job applications.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tech Stack Tab */}
          {activeTab === 'tech' && (
            <div className="relative z-10 max-w-2xl space-y-8">
               <div className="pb-6 border-b border-white/5">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest mb-2">Internal Ecosystem</h3>
                  <p className="text-xs text-slate-500 font-medium">List the technologies your organization utilizes. This helps in talent discovery.</p>
                </div>
                <div className="cockpit-tech-wrapper p-6 rounded-3xl bg-white/5 border border-white/5">
                   <OrganizationTechStack company={displayCompany} />
                </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="relative z-10 space-y-8">
               <div className="pb-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest mb-2">Gallery Showcase</h3>
                    <p className="text-xs text-slate-500 font-medium">Upload photos showcasing your culture, office, and product.</p>
                  </div>
                </div>
                <div className="cockpit-gallery-wrapper">
                   <OrganizationGallery company={displayCompany} />
                </div>
            </div>
          )}

          {/* Hierarchy Tab */}
          {activeTab === 'hierarchy' && (
            <div className="relative z-10 space-y-8">
               <div className="pb-6 border-b border-white/5">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest mb-2">Organization Tree</h3>
                  <p className="text-xs text-slate-500 font-medium">Manage parent-child relationships and venture subdivisions.</p>
                </div>
                <div className="cockpit-hierarchy-wrapper space-y-10">
                   <OrgSubOrganizations orgId={displayCompany.org_id || displayCompany.company_id} />
                   
                   <div className="p-8 rounded-[32px] border border-dashed border-white/10 bg-white/5 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-slate-900 mx-auto flex items-center justify-center border border-white/5">
                         <Plus className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-sm font-bold text-white tracking-tight uppercase tracking-widest">Connect Parent Organization</h4>
                         <p className="text-[11px] text-slate-500 font-medium">Send a request to a parent entity to appear in their hierarchy.</p>
                      </div>
                      <Button variant="ghost" className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest">
                         Start Request
                      </Button>
                   </div>
                </div>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="relative z-10 space-y-8">
               <div className="pb-6 border-b border-white/5">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest mb-2">Security & Governance</h3>
                  <p className="text-xs text-slate-500 font-medium">High-risk actions related to ownership and profile existence.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-8 rounded-[32px] border border-white/5 bg-white/5 space-y-6">
                      <div className="flex items-center gap-3">
                         <Users className="w-5 h-5 text-amber-500" />
                         <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">Transfer Ownership</h4>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                         Assign a new primary owner to the organization. You will lose administrative rights upon completion.
                      </p>
                      <Button variant="outline" className="w-full h-12 rounded-xl border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white font-black text-xs uppercase tracking-widest">
                         Start Transfer
                      </Button>
                   </div>

                   <div className="p-8 rounded-[32px] border border-rose-500/10 bg-rose-500/5 space-y-6">
                      <div className="flex items-center gap-3">
                         <AlertTriangle className="w-5 h-5 text-rose-500" />
                         <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">Delete Organization</h4>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                         Permanently delete this organization and all its data. This action is irreversible and cannot be undone.
                      </p>
                      <Button variant="ghost" className="w-full h-12 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest">
                         Proceed to Deletion
                      </Button>
                   </div>
                </div>

                <div className="cockpit-settings-wrapper p-8 rounded-[32px] border border-white/5 bg-white/5">
                   <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6">General Preferences</h4>
                   <OrganizationSettings company={displayCompany} />
                </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <style jsx global>{`
        .cockpit-form-wrapper label {
          font-size: 11px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          color: #64748b !important; /* slate-500 */
          margin-bottom: 8px !important;
          display: block !important;
        }
        .cockpit-form-wrapper input, 
        .cockpit-form-wrapper textarea,
        .cockpit-form-wrapper button[role="combobox"] {
          background-color: rgba(15, 23, 42, 0.4) !important; /* slate-900/40 */
          border-color: rgba(255, 255, 255, 0.05) !important;
          border-radius: 16px !important;
          color: white !important;
          padding: 12px 20px !important;
          font-size: 14px !important;
        }
        .cockpit-form-wrapper button[type="submit"] {
          border-radius: 16px !important;
          background-color: #818cf8 !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
        }
        
        /* Tech Stack Overrides */
        .cockpit-tech-wrapper h3 { display: none; }
        
        /* Gallery Overrides */
        .cockpit-gallery-wrapper h3 { display: none; }
        
        /* Hierarchy Overrides */
        .cockpit-hierarchy-wrapper > div {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .cockpit-hierarchy-wrapper h2 { 
          font-size: 14px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          color: white !important;
        }
        
        /* Settings Overrides */
        .cockpit-settings-wrapper > div {
           background: transparent !important;
           border: none !important;
           padding: 0 !important;
           box-shadow: none !important;
        }
      `}</style>
    </div>
  )
}
