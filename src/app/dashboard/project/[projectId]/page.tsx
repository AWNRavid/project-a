import { ProjectView } from "@/features/project/components/project-view";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ issue?: string }>;
}) {
  const { projectId } = await params;
  const { issue } = await searchParams;

  return (
    <div className="flex flex-col gap-6 p-6">
      <ProjectView
        key={issue ?? "project"}
        projectId={projectId}
        initialIssueId={issue ?? null}
      />
    </div>
  );
}
