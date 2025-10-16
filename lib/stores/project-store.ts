import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '@/features/project-management/types/project';
import { v4 as uuidv4 } from 'uuid';

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setActiveProject: (id: string | null) => void;
  addProject: (name: string, description?: string) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  incrementImageCount: (id: string) => void;
  updateCoverImage: (id: string, imageUrl: string) => void;
  loadProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,

      setProjects: (projects) => set({ projects }),

      setActiveProject: (id) => set({ activeProjectId: id }),

      addProject: async (name, description) => {
        try {
          // Call API to create project
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, description }),
          });

          if (!response.ok) {
            throw new Error('Failed to create project on server');
          }

          const data = await response.json();
          const newProject: Project = data;

          // Update store with server-created project
          set((state) => ({
            projects: [...state.projects, newProject],
            activeProjectId: newProject.id,
          }));
        } catch (error) {
          console.error('Error creating project:', error);

          // Fallback: Create project locally if API fails
          const newProject: Project = {
            id: uuidv4(),
            name,
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageCount: 0,
            images: [],
          };

          set((state) => ({
            projects: [...state.projects, newProject],
            activeProjectId: newProject.id,
          }));
        }
      },

      updateProject: (id, data) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => {
          const newProjects = state.projects.filter((p) => p.id !== id);
          return {
            projects: newProjects,
            activeProjectId:
              state.activeProjectId === id
                ? newProjects[0]?.id || null
                : state.activeProjectId,
          };
        }),

      incrementImageCount: (id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, imageCount: p.imageCount + 1, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      updateCoverImage: (id, imageUrl) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id && !p.coverImage
              ? { ...p, coverImage: imageUrl, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      loadProjects: async () => {
        try {
          const response = await fetch('/api/projects');
          if (response.ok) {
            const data = await response.json();
            set({ projects: data.projects || [] });
          }
        } catch (error) {
          console.error('Error loading projects:', error);
        }
      },
    }),
    {
      name: 'seedream-projects', // localStorage key
    }
  )
);
