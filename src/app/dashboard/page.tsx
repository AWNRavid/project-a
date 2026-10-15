import { ProjectList } from "@/features/project/components/project-list";

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Project List</h1>
        <p className="text-muted-foreground text-sm">Manage your projects.</p>
      </div>
      <ProjectList />
    </div>
  );
}
