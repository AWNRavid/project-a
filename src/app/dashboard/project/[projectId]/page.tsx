import { ProjectView } from "@/features/project/components/project-view";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col gap-6 p-6">
      <ProjectView projectId={projectId} />
    </div>
  );
}
