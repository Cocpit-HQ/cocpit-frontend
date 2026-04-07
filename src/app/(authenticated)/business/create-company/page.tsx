import React from 'react'
import { StepIndicator } from '@/components/business/StepIndicator'
import { CreateCompanyForm } from '@/components/business/CreateCompanyForm'
import { ProTips, DesignGuide, LivePreview } from '@/components/business/BusinessCards'

export default function CreateCompanyPage() {
  return (
    <div className="max-w-[1400px] mx-auto min-h-screen flex flex-col pt-10 pb-20 px-8">
      {/* Header section */}
      <div className="mb-14 animate-in fade-in slide-in-from-top-10 duration-700">
        <h1 className="text-5xl font-black text-white tracking-tight mb-4 uppercase">
           Build Your Enterprise
        </h1>
        <p className="text-slate-400 text-xl font-bold tracking-tight opacity-80">
           Step 1: Set the foundation of your professional ecosystem.
        </p>
      </div>

      <div className="animate-in fade-in zoom-in-95 duration-1000 delay-300">
         <StepIndicator currentStep={1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-14 mt-6">
        {/* Main Content Area: Left Side */}
        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-left-10 duration-1000 delay-500">
           <CreateCompanyForm />
        </div>

        {/* Side Info Panel: Right Side */}
        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-right-10 duration-1000 delay-700">
           <DesignGuide />
           <ProTips />
           <LivePreview />
        </div>
      </div>
    </div>
  )
}
