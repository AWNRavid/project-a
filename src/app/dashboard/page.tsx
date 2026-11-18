import { PageHeader } from "@/components/page-header";
import { ProjectList } from "@/features/project/components/project-list";

export default function Page() {
  return (
    <div className="pb-10">
      <PageHeader
        title="Projects"
        description="Every project charted in this workspace, newest first."
      />

      <div className="px-6 pt-5">
        <ProjectList />
      </div>
    </div>
  );
}
