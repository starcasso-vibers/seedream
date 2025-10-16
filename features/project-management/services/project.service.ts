import type { Project } from "../types/project";

/**
 * Get the currently active project from local storage
 */
export async function getActiveProject(): Promise<Project | null> {
  try {
    const stored = localStorage.getItem("project-store");
    if (!stored) return null;

    const state = JSON.parse(stored);
    const activeProjectId = state.state?.activeProjectId;

    if (!activeProjectId) return null;

    const projects = state.state?.projects || [];
    return projects.find((p: Project) => p.id === activeProjectId) || null;
  } catch (error) {
    console.error("Error getting active project:", error);
    return null;
  }
}

/**
 * Set the active project
 */
export async function setActiveProject(projectId: string): Promise<void> {
  try {
    const stored = localStorage.getItem("project-store");
    if (!stored) return;

    const state = JSON.parse(stored);
    state.state.activeProjectId = projectId;
    localStorage.setItem("project-store", JSON.stringify(state));
  } catch (error) {
    console.error("Error setting active project:", error);
  }
}
