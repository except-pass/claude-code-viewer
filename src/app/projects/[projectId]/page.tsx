import { ProjectPageContent } from "./components/ProjectPage";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  return <ProjectPageContent projectId={projectId} />;
}
