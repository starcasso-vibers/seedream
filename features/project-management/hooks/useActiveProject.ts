import { useQuery } from "@tanstack/react-query";
import { getActiveProject } from "../services/project.service";
import type { Project } from "../types/project";

/**
 * Hook to get the currently active project
 */
export function useActiveProject() {
  const { data: activeProject, isLoading } = useQuery<Project | null>({
    queryKey: ["active-project"],
    queryFn: getActiveProject,
  });

  return {
    activeProject,
    isLoading,
  };
}
