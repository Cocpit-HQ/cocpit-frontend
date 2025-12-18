import JobsPage from "@/components/jobs/JobsPage";

export default function JobsRoute({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  return <JobsPage searchParams={searchParams} />;
}

