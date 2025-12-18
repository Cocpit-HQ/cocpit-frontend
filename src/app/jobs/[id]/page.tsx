"use client"

import { useParams, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ArrowLeft, Briefcase, Clock, MapPin } from "lucide-react"
import { jobs, logoGradients } from "@/lib/data/jobs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { resolvedTheme } = useTheme()
  const { toast } = useToast()

  const jobId = params.id
  const job = jobs.find((j) => j.id.toString() === jobId)

  const isDark = resolvedTheme === "dark"

  const handleApply = () => {
    // Here, you would typically make an API call to submit the application
    console.log(`Applying for job: ${job?.title}`)
    
    // Show a confirmation toast
    toast({
      title: "Application Submitted!",
      description: `You have successfully applied for the ${job?.title} position.`,
    })

    // Redirect to the "My Jobs" -> "Applied" tab
    router.push("/jobs?tab=my-jobs&subtab=applied")
  }

  if (!job) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#171c28] text-white" : "bg-gray-100"}`}>
        Job not found.
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <header className="mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Job Listings
          </button>
        </header>

        <main className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} border rounded-xl p-6 md:p-8`}>
          <div className="flex items-start gap-6 mb-6">
            <div className={`w-16 h-16 bg-gradient-to-br ${logoGradients[job.logo]} rounded-xl flex-shrink-0`}/>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{job.title}</h1>
              <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>{job.company}</p>
            </div>
          </div>
          
          <div className={`flex flex-wrap gap-x-6 gap-y-2 text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
              <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.type}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Posted {job.postedTime}</span>
              <span className="text-lg font-semibold text-[#5B7CFF]">{job.salary}</span>
          </div>

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
            <h2>About the role</h2>
            <p>
              This is a placeholder for the full job description. When the API is integrated, this section will be populated with detailed information about the role, responsibilities, and qualifications.
            </p>
            <p>
              For now, imagine a comprehensive overview of the position, what the day-to-day looks like, and what the team is looking for in a candidate.
            </p>
            <h2>Responsibilities</h2>
            <ul>
              <li>Work with product managers and designers to define and implement new features.</li>
              <li>Write clean, maintainable, and well-tested code.</li>
              <li>Participate in code reviews to maintain a high-quality code culture.</li>
              <li>Triage and fix bugs to ensure a stable and reliable product.</li>
            </ul>
            <h2>Qualifications</h2>
            <ul>
              <li>Bachelor's degree in Computer Science or related field.</li>
              <li>3+ years of experience in software development.</li>
              <li>Proficiency in JavaScript/TypeScript and React.</li>
              <li>Experience with modern frontend tools like Webpack, Babel, and Next.js.</li>
            </ul>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <Button onClick={handleApply} size="lg" className="px-12 py-3 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-md">
              Apply for this Job
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
