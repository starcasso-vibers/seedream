/**
 * React Query hooks for project management
 * Manages project CRUD operations with Zustand store integration
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  DeleteProjectResponse,
} from '../../project-management/types/project';

// Query keys for cache management
export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

/**
 * Mock API client for project operations
 * Replace with actual API calls when backend is ready
 */
const projectApi = {
  async getAll(): Promise<Project[]> {
    // For now, return from localStorage
    const stored = localStorage.getItem('projects');
    return stored ? JSON.parse(stored) : [];
  },

  async create(data: CreateProjectRequest): Promise<Project> {
    const projects = await this.getAll();
    const newProject: Project = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageCount: 0,
    };
    projects.push(newProject);
    localStorage.setItem('projects', JSON.stringify(projects));
    return newProject;
  },

  async update(id: string, data: UpdateProjectRequest): Promise<Project> {
    const projects = await this.getAll();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Project ${id} not found`);
    }
    const updated = {
      ...projects[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    projects[index] = updated;
    localStorage.setItem('projects', JSON.stringify(projects));
    return updated;
  },

  async delete(id: string): Promise<DeleteProjectResponse> {
    const projects = await this.getAll();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem('projects', JSON.stringify(filtered));

    // Also delete associated images from localStorage
    const imagesKey = `project_images_${id}`;
    const images = localStorage.getItem(imagesKey);
    const deletedCount = images ? JSON.parse(images).length : 0;
    localStorage.removeItem(imagesKey);

    return {
      success: true,
      deletedImageCount: deletedCount,
    };
  },
};

/**
 * Hook for fetching all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => projectApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for creating a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectApi.create(data),
    onSuccess: (newProject) => {
      // Update cache with new project
      queryClient.setQueryData<Project[]>(projectKeys.all, (old) => {
        return old ? [...old, newProject] : [newProject];
      });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error: Error) => {
      console.error('Failed to create project:', error);
    },
  });
}

/**
 * Hook for updating an existing project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      projectApi.update(id, data),
    onSuccess: (updatedProject) => {
      // Optimistically update cache
      queryClient.setQueryData<Project[]>(projectKeys.all, (old) => {
        if (!old) return [updatedProject];
        return old.map((p) => (p.id === updatedProject.id ? updatedProject : p));
      });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(updatedProject.id) });
    },
    onError: (error: Error) => {
      console.error('Failed to update project:', error);
    },
  });
}

/**
 * Hook for deleting a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData<Project[]>(projectKeys.all, (old) => {
        return old ? old.filter((p) => p.id !== deletedId) : [];
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });

      // Invalidate project images cache
      queryClient.invalidateQueries({ queryKey: ['project-images', deletedId] });
    },
    onError: (error: Error) => {
      console.error('Failed to delete project:', error);
    },
  });
}
