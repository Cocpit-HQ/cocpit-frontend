import { Experience } from "@/types/entities";

export function getResumeOverview(experiences: Experience[]) {
  // Calculate total years based on months
  let totalMonths = 0;
  let featuresShipped = 0; // Mock calculation based on description

  experiences.forEach((exp) => {
    if (!exp.start_date) return;
    const start = new Date(exp.start_date);
    if (isNaN(start.getTime())) return;

    const end = exp.end_date ? new Date(exp.end_date) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const expMonths = Math.max(0, months);
    totalMonths += expMonths;

    // Simple heuristic: 5 features per year of experience
    const expYears = Math.round(expMonths / 12);
    if (expYears > 0) {
      featuresShipped += (expYears * 5);
    }
  });

  // Ensure at least 0 years
  let displayYears = 0;
  if (experiences.length > 0) {
    displayYears = Math.round(totalMonths / 12);
  }
  
  const displayFeatures = featuresShipped > 0 ? featuresShipped * 3 : 15; // inflating for "15+ features"

  return {
    yearsOfExperience: `${displayYears}+ years experience`,
    featuresShipped: `${displayFeatures}+ features shipped`,
    summary: `Product leader with ${displayYears}+ years of experience in high-growth tech environments. Specializing in data-driven product strategy and user-centric design.`
  };
}
