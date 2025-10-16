/**
 * React Query hooks for image generation
 * Handles image generation, fetching, and deletion with optimistic updates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import type {
  GenerationParams,
  ImageMetadata,
  GenerationResult,
} from '../types/image';

// Query keys for cache management
export const imageKeys = {
  all: ['images'] as const,
  project: (projectId: string) => ['project-images', projectId] as const,
};

/**
 * Mock storage for images (replace with actual backend API)
 */
const imageStorage = {
  async getProjectImages(projectId: string): Promise<ImageMetadata[]> {
    const key = `project_images_${projectId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },

  async saveImage(image: ImageMetadata): Promise<void> {
    const key = `project_images_${image.projectId}`;
    const images = await this.getProjectImages(image.projectId);
    images.push(image);
    localStorage.setItem(key, JSON.stringify(images));
  },

  async deleteImage(projectId: string, imageId: string): Promise<void> {
    const key = `project_images_${projectId}`;
    const images = await this.getProjectImages(projectId);
    const filtered = images.filter((img) => img.id !== imageId);
    localStorage.setItem(key, JSON.stringify(filtered));
  },
};

/**
 * Hook for generating images
 */
export function useGenerateImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerationParams): Promise<GenerationResult> => {
      try {
        // Create FormData for file uploads
        const formData = new FormData();
        formData.append('prompt', params.prompt);
        formData.append('size', params.size);
        formData.append('numImages', params.numImages.toString());
        formData.append('watermark', params.watermark.toString());
        formData.append('projectId', params.projectId);

        // Append reference images if provided
        if (params.referenceImages && params.referenceImages.length > 0) {
          params.referenceImages.forEach((file) => {
            formData.append('referenceImages', file);
          });
        }

        // Call Next.js API route
        const response = await fetch('/api/generate', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API request failed: ${response.status}`);
        }

        const data = await response.json();

        // Create image metadata from API response
        const images: ImageMetadata[] = data.images.map((img: any) => ({
          id: uuidv4(),
          projectId: params.projectId,
          prompt: params.prompt,
          size: params.size,
          watermark: params.watermark,
          referenceImages: [],
          generatedUrl: img.url,
          createdAt: new Date().toISOString(),
        }));

        // Save to local storage
        for (const image of images) {
          await imageStorage.saveImage(image);
        }

        return {
          success: true,
          images,
        };
      } catch (error) {
        return {
          success: false,
          images: [],
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
    onSuccess: (result, params) => {
      if (result.success) {
        // Optimistically update project images cache
        queryClient.setQueryData<ImageMetadata[]>(
          imageKeys.project(params.projectId),
          (old) => {
            return old ? [...old, ...result.images] : result.images;
          }
        );

        // Invalidate to ensure consistency
        queryClient.invalidateQueries({
          queryKey: imageKeys.project(params.projectId),
        });

        // Update project's image count
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    },
    onError: (error: Error) => {
      console.error('Image generation failed:', error);
    },
  });
}

/**
 * Hook for fetching project images
 */
export function useProjectImages(projectId: string) {
  return useQuery({
    queryKey: imageKeys.project(projectId),
    queryFn: () => imageStorage.getProjectImages(projectId),
    enabled: !!projectId, // Only fetch if projectId is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for deleting an image
 */
export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      imageId,
    }: {
      projectId: string;
      imageId: string;
    }) => {
      await imageStorage.deleteImage(projectId, imageId);
      return { projectId, imageId };
    },
    onMutate: async ({ projectId, imageId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: imageKeys.project(projectId),
      });

      // Snapshot previous value
      const previousImages = queryClient.getQueryData<ImageMetadata[]>(
        imageKeys.project(projectId)
      );

      // Optimistically update
      queryClient.setQueryData<ImageMetadata[]>(
        imageKeys.project(projectId),
        (old) => {
          return old ? old.filter((img) => img.id !== imageId) : [];
        }
      );

      return { previousImages };
    },
    onError: (error, { projectId }, context) => {
      // Rollback on error
      if (context?.previousImages) {
        queryClient.setQueryData(
          imageKeys.project(projectId),
          context.previousImages
        );
      }
      console.error('Failed to delete image:', error);
    },
    onSettled: (data) => {
      if (data) {
        // Invalidate to ensure consistency
        queryClient.invalidateQueries({
          queryKey: imageKeys.project(data.projectId),
        });
        // Update project's image count
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    },
  });
}

/**
 * Hook for batch deleting images
 */
export function useBatchDeleteImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      imageIds,
    }: {
      projectId: string;
      imageIds: string[];
    }) => {
      await Promise.all(
        imageIds.map((imageId) => imageStorage.deleteImage(projectId, imageId))
      );
      return { projectId, imageIds };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({
        queryKey: imageKeys.project(projectId),
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      console.error('Batch delete failed:', error);
    },
  });
}
