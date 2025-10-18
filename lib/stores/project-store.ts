import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '@/features/project-management/types/project';
import type { GenerationJob } from '@/features/image-generation/types/generation-job';
import { v4 as uuidv4 } from 'uuid';

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  jobs: GenerationJob[];

  // Project Actions
  setProjects: (projects: Project[]) => void;
  setActiveProject: (id: string | null) => void;
  addProject: (name: string, description?: string) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  incrementImageCount: (id: string) => void;
  updateCoverImage: (id: string, imageUrl: string) => void;
  loadProjects: () => Promise<void>;

  // Job Queue Actions
  addJob: (job: GenerationJob) => void;
  updateJob: (jobId: string, updates: Partial<GenerationJob>) => void;
  removeJob: (jobId: string) => void;
  getJobsByProject: (projectId: string) => GenerationJob[];
  getActiveJobCount: (projectId: string) => number;
  getAllActiveJobs: () => GenerationJob[];
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      jobs: [],

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

      // Job Queue Actions
      addJob: (job) =>
        set((state) => ({
          jobs: [...state.jobs, job],
        })),

      updateJob: (jobId, updates) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === jobId ? { ...job, ...updates } : job
          ),
        })),

      removeJob: (jobId) =>
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== jobId),
        })),

      getJobsByProject: (projectId) => {
        const state = get();
        return state.jobs.filter((job) => job.projectId === projectId);
      },

      getActiveJobCount: (projectId) => {
        const state = get();
        return state.jobs.filter(
          (job) =>
            job.projectId === projectId &&
            (job.status === 'pending' || job.status === 'processing')
        ).length;
      },

      getAllActiveJobs: () => {
        const state = get();
        return state.jobs.filter(
          (job) => job.status === 'pending' || job.status === 'processing'
        );
      },
    }),
    {
      name: 'seedream-projects', // localStorage key
    }
  )
);
