"use client";

import React from "react";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import type { UserData, User } from "@/types/user";
import type { Experience, Education, Project, ExperienceGroup } from "@/types/entities";

export interface ResumeTemplateProps {
  user?: UserData | User | null;
  experiences?: Experience[] | ExperienceGroup[];
  educations?: Education[];
  projects?: Project[];
  skills?: any[];
  className?: string;
  id?: string;
}

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const month = d.toLocaleDateString("en-US", { month: "short" }).replace(/\./g, "");
    const year = d.getFullYear();
    return `${month} ${year}`;
  } catch {
    return "";
  }
};

const formatMonthYear = (monthStr?: string | null, yearStr?: string | null): string => {
  if (!monthStr && !yearStr) return "";
  if (!monthStr) return yearStr ? String(yearStr).trim() : "";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let formattedMonth = String(monthStr).trim();
  const numericMonth = parseInt(formattedMonth, 10);
  if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
    formattedMonth = months[numericMonth - 1];
  } else {
    const cleanStr = formattedMonth.replace(/\./g, "").trim();
    const foundIdx = months.findIndex((m) => m.toLowerCase() === cleanStr.toLowerCase() || cleanStr.toLowerCase().startsWith(m.toLowerCase()));
    if (foundIdx !== -1) {
      formattedMonth = months[foundIdx];
    }
  }
  return yearStr ? `${formattedMonth} ${yearStr}` : formattedMonth;
};

const formatProjectDates = (project: Project): string => {
  const start = formatMonthYear(project.start_month, project.start_year);
  if (project.is_current) {
    return start ? `${start} - Present` : "Present";
  }
  const end = formatMonthYear(project.end_month, project.end_year);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return "";
};

const parseBullets = (text?: string | null): string[] => {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-•*]\s*/, ""))
    .filter((line) => line.length > 0);
};

export const ResumeTemplate: React.FC<ResumeTemplateProps> = ({
  user,
  experiences = [],
  educations = [],
  projects = [],
  skills = [],
  className = "",
  id = "resume-print-area",
}) => {
  // Normalize experiences: handle both grouped (ExperienceGroup[]) and flat (Experience[])
  const flatExperiences = React.useMemo<Experience[]>(() => {
    if (!experiences || experiences.length === 0) return [];
    return (experiences as any[]).flatMap((item) => {
      if (Array.isArray(item.experiences) && item.experiences.length > 0) {
        return item.experiences.map((inner: Experience) => ({
          ...inner,
          company_name: inner.company_name || item.company_name || "",
        }));
      }
      return [item as Experience];
    });
  }, [experiences]);

  // Extract skills as string array
  const skillNames = React.useMemo<string[]>(() => {
    if (!skills || skills.length === 0) return [];
    return skills
      .map((s) => (typeof s === "string" ? s : s?.name || s?.skill_name || ""))
      .filter((name) => Boolean(name && name.trim()));
  }, [skills]);

  // Contact items - strictly only present data
  const contactItems = [
    user?.mobile_number && {
      icon: <Phone className="w-3.5 h-3.5 inline-block text-black shrink-0" />,
      text: user.mobile_number,
    },
    user?.email && {
      icon: <Mail className="w-3.5 h-3.5 inline-block text-black shrink-0" />,
      text: user.email,
    },
    user?.account_name && {
      icon: <Globe className="w-3.5 h-3.5 inline-block text-black shrink-0" />,
      text: `@${user.account_name.replace(/^@/, "")}`,
    },
    user?.location && {
      icon: <MapPin className="w-3.5 h-3.5 inline-block text-black shrink-0" />,
      text: user.location,
    },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; text: string }>;

  const hasExperiences = flatExperiences.length > 0;
  const hasProjects = projects.length > 0;
  const hasEducations = educations.length > 0;
  const hasSkills = skillNames.length > 0;

  return (
    <article
      id={id}
      style={{
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
      className={`relative text-black w-full max-w-[800px] min-h-[1050px] p-8 sm:p-14 shadow-2xl mx-auto font-sans leading-normal selection:bg-neutral-200 selection:text-black print:p-0 print:shadow-none print:max-w-none print:w-full print:m-0 print:min-h-0 print:text-black ${className}`}
    >
      {/* ─── Header: Name & Contact Info ─── */}
      <header className="flex flex-col items-center text-center pb-4">
        <h1 className="text-3xl sm:text-[34px] font-bold tracking-tight text-black capitalize mb-2 print:text-3xl">
          {user?.name || "Professional Profile"}
        </h1>

        {contactItems.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12.5px] text-neutral-800 font-normal">
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  {item.icon}
                  <span>{item.text}</span>
                </span>
                {idx < contactItems.length - 1 && (
                  <span className="text-neutral-400 select-none">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      {/* ─── EXPERIENCE SECTION ─── */}
      {hasExperiences && (
        <section className="mt-4 mb-5">
          <h2 className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-black pb-0.5 border-b border-black mb-2.5">
            Experience
          </h2>

          <div className="space-y-2.5">
            {flatExperiences.map((exp, idx) => {
              const startDate = formatDate(exp.start_date);
              const endDate = exp.is_current ? "Present" : formatDate(exp.end_date);
              const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || "";
              const bullets = parseBullets(exp.description);
              const expSkills = Array.isArray(exp.skills)
                ? exp.skills
                  .map((s) => (typeof s === "string" ? s : s?.name || s?.skill_name || ""))
                  .filter(Boolean)
                : [];

              return (
                <div key={exp.experience_id || idx} className="break-inside-avoid">
                  {/* Top Line: Company & Date Range */}
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="font-bold text-[14px] text-black leading-tight">
                      {exp.company_name || "Company"}
                    </span>
                    {dateRange && (
                      <span className="text-[12.5px] text-black whitespace-nowrap font-normal">
                        {dateRange}
                      </span>
                    )}
                  </div>

                  {/* Second Line: Role & Location */}
                  <div className="flex justify-between items-baseline gap-4 mt-2.5">
                    <span className="italic text-[13px] text-neutral-900">
                      {exp.title || "Role"}
                    </span>
                    {exp.location && (
                      <span className="text-[12.5px] text-neutral-700 whitespace-nowrap">
                        {exp.location}
                      </span>
                    )}
                  </div>

                  {/* Bullets */}
                  {bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-2.5 space-y-0.5 text-[12.5px] text-black leading-relaxed">
                      {bullets.map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                    </ul>
                  )}

                  {/* Skills used in this experience (if present) */}
                  {expSkills.length > 0 && (
                    <p className="text-[12px] text-neutral-700 mt-1 ml-4">
                      <span className="font-semibold text-black">Technologies: </span>
                      {expSkills.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── PROJECTS SECTION ─── */}
      {hasProjects && (
        <section className="mt-4 mb-5">
          <h2 className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-black pb-0.5 border-b border-black mb-2.5">
            Projects
          </h2>

          <div className="space-y-2.5">
            {projects.map((project, idx) => {
              const dateRange = formatProjectDates(project);
              const bullets = parseBullets(project.details || project.role_description);
              const projectSkills = Array.isArray(project.skills) ? project.skills.filter(Boolean) : [];

              return (
                <div key={project.project_id || idx} className="break-inside-avoid">
                  {/* Top Line: Title, Organization, Dates */}
                  <div className="flex justify-between items-baseline gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-[14px] text-black leading-tight">
                        {project.title}
                      </span>
                      {project.organization && (
                        <span className="italic text-[13px] text-neutral-700">
                          — {project.organization}
                        </span>
                      )}
                    </div>
                    {dateRange && (
                      <span className="text-[12.5px] text-black whitespace-nowrap font-normal">
                        {dateRange}
                      </span>
                    )}
                  </div>

                  {/* Role subtitle if specified */}
                  {project.role && (
                    <div className="italic text-[13px] text-neutral-900 mt-1.5">
                      {project.role}
                    </div>
                  )}

                  {/* Project Bullets */}
                  {bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-2.5 space-y-0.5 text-[12.5px] text-black leading-relaxed">
                      {bullets.map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                    </ul>
                  )}

                  {/* Skills/Technologies */}
                  {projectSkills.length > 0 && (
                    <p className="text-[12px] text-neutral-700 mt-1 ml-4">
                      <span className="font-semibold text-black">Technologies: </span>
                      {projectSkills.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── EDUCATION SECTION ─── */}
      {hasEducations && (
        <section className="mt-4 mb-5">
          <h2 className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-black pb-0.5 border-b border-black mb-2.5">
            Education
          </h2>

          <div className="space-y-2.5">
            {educations.map((edu, idx) => {
              const startDate = formatDate(edu.start_date);
              const isCurrent = Boolean((edu as any).is_current || !edu.end_date);
              const endDate = isCurrent ? "Present" : formatDate(edu.end_date);
              const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || "";
              const degreeStr = [edu.degree, edu.field_of_study].filter(Boolean).join(" in ");
              const bullets = parseBullets(edu.description);

              return (
                <div key={edu.education_id || idx} className="break-inside-avoid">
                  {/* Top Line: School Name & Dates */}
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="font-bold text-[14px] text-black leading-tight">
                      {edu.school_name}
                    </span>
                    {dateRange && (
                      <span className="text-[12.5px] text-black whitespace-nowrap font-normal">
                        {dateRange}
                      </span>
                    )}
                  </div>

                  {/* Second Line: Degree & Location */}
                  <div className="flex justify-between items-baseline gap-4 mt-1.5">
                    {degreeStr && (
                      <span className="italic text-[13px] text-neutral-900">
                        {degreeStr}
                      </span>
                    )}
                    {edu.location && (
                      <span className="text-[12.5px] text-neutral-700 whitespace-nowrap">
                        {edu.location}
                      </span>
                    )}
                  </div>

                  {/* Education Bullets */}
                  {bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-2.5 space-y-0.5 text-[12.5px] text-black leading-relaxed">
                      {bullets.map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── SKILLS SECTION ─── */}
      {hasSkills && (
        <section className="mt-4 mb-2">
          <h2 className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider text-black pb-0.5 border-b border-black mb-2.5">
            Skills
          </h2>

          <div className="text-[12.5px] text-black leading-relaxed">
            <span className="font-bold text-black">Skills : </span>
            <span>{skillNames.join(", ")}</span>
          </div>
        </section>
      )}

      {/* ─── COCPIT FOOTER ─── */}
      <footer className="absolute bottom-[-16px] right-[-8px]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1024 1024"
          width="57"
          height="58"
          fill="none"
          aria-hidden="true"
        >
          <g fill="#000000">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M 678.68 262.00 L 729.00 261.69 L 731.47 263.00 L 731.21 361.00 L 729.00 362.60 L 699.00 363.96 L 684.00 366.09 L 659.00 372.63 L 648.00 377.29 L 637.00 383.88 L 627.00 392.12 L 620.32 400.00 L 611.55 415.00 L 607.00 429.26 L 604.78 441.00 L 603.28 459.00 L 602.66 539.00 L 600.00 539.94 L 476.52 540.00 L 475.46 538.00 L 474.78 520.00 L 474.79 414.00 L 476.68 393.00 L 481.00 370.17 L 485.29 357.00 L 490.00 346.24 L 500.36 330.00 L 515.00 314.07 L 533.66 299.00 L 552.27 288.00 L 573.00 279.30 L 594.00 272.68 L 615.00 268.18 L 648.00 263.92 L 678.68 262.00 Z M 290.82 462.00 L 410.47 462.00 L 411.34 464.00 L 410.90 542.00 L 413.63 564.00 L 418.28 579.00 L 424.77 592.00 L 438.00 608.84 L 454.97 622.00 L 467.00 628.44 L 484.00 635.03 L 500.00 639.26 L 533.00 643.33 L 601.00 643.71 L 603.00 644.79 L 603.00 758.41 L 598.00 759.52 L 531.00 758.55 L 471.00 754.55 L 440.00 750.09 L 417.00 743.54 L 388.00 730.68 L 361.00 713.33 L 340.00 695.54 L 322.68 676.00 L 314.00 662.90 L 303.00 638.72 L 294.06 609.00 L 289.94 573.00 L 289.91 464.00 L 290.82 462.00 Z"
            />
          </g>
        </svg>
      </footer>
    </article>
  );
};

export default ResumeTemplate;
