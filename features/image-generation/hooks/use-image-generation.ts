/**
 * React Query hooks for image generation
 * Handles async image generation with polling, fetching, and deletion with optimistic updates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useProjectStore } from '@/lib/stores/project-store';
import type { GenerationJob } from '../types/generation-job';
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
 * Hook for async image generation with job tracking
 */
export function useGenerateImage() {
  const queryClient = useQueryClient();
  const { addJob, updateJob, removeJob } = useProjectStore();

  return useMutation({
    mutationFn: async (params: GenerationParams): Promise<{ jobId: string; params: GenerationParams }> => {
      // Create a batch ID for grouping related jobs
      const batchId = uuidv4();
      const jobIds: string[] = [];

      // Create individual jobs for each image in the batch
      for (let i = 0; i < params.numImages; i++) {
        const jobId = uuidv4();
        const job: GenerationJob = {
          id: jobId,
          projectId: params.projectId,
          prompt: params.prompt,
          size: params.size,
          numImages: 1, // Each job generates 1 image
          watermark: params.watermark,
          referenceImages: params.referenceImages?.map((f) => f.name) || [],
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
          // Batch information
          batchId,
          imageIndex: i + 1,
          totalInBatch: params.numImages,
        };

        // Add each job to queue
        addJob(job);
        jobIds.push(jobId);
      }

      try {
        // Start generation in background
        const formData = new FormData();
        formData.append('prompt', params.prompt);
        formData.append('size', params.size);
        formData.append('numImages', params.numImages.toString());
        formData.append('watermark', params.watermark.toString());
        formData.append('projectId', params.projectId);
        formData.append('batchId', batchId);

        if (params.referenceImages && params.referenceImages.length > 0) {
          params.referenceImages.forEach((file) => {
            formData.append('referenceImages', file);
          });
        }

        // Update all jobs in batch to processing
        jobIds.forEach((id) => {
          updateJob(id, { status: 'processing', startedAt: new Date().toISOString() });
        });

        // Start generation (no await - runs in background)
        fetch('/api/generate', {
          method: 'POST',
          body: formData,
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `API request failed: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            // Images are already saved incrementally by the API route
            // No need to save here - just update job status

            // Update all jobs in batch as completed
            jobIds.forEach((id) => {
              updateJob(id, {
                status: 'completed',
                progress: 100,
                completedAt: new Date().toISOString(),
              });
              // Remove each job after 2 seconds
              setTimeout(() => removeJob(id), 2000);
            });

            // Invalidate queries to refresh images
            queryClient.invalidateQueries({
              queryKey: imageKeys.project(params.projectId),
            });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          })
          .catch((error) => {
            // Update all jobs in batch as failed
            jobIds.forEach((id) => {
              updateJob(id, {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                completedAt: new Date().toISOString(),
              });
              // Remove each failed job after 5 seconds
              setTimeout(() => removeJob(id), 5000);
            });
          });

        // Return immediately with first job ID (for backward compatibility)
        return { jobId: jobIds[0], params };
      } catch (error) {
        // Update all jobs as failed
        jobIds.forEach((id) => {
          updateJob(id, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date().toISOString(),
          });
        });
        throw error;
      }
    },
    onError: (error: Error) => {
      console.error('Image generation failed:', error);
    },
  });
}

/**
 * Hook for simulating progress updates (every 2 seconds)
 */
export function useJobProgressSimulation() {
  const { jobs, updateJob } = useProjectStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      jobs.forEach((job) => {
        if (job.status === 'processing' && job.progress < 90) {
          updateJob(job.id, { progress: Math.min(job.progress + 10, 90) });
        }
      });
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobs, updateJob]);
}

/**
 * Hook for fetching project images with real-time polling
 * ⭐ Polls every 2 seconds to show images as they're generated
 */
export function useProjectImages(projectId: string) {
  return useQuery({
    queryKey: imageKeys.project(projectId),
    queryFn: async () => {
      const response = await fetch(`/api/images?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project images');
      }
      const data = await response.json();
      return data.images || [];
    },
    enabled: !!projectId, // Only fetch if projectId is provided
    refetchInterval: 2000, // ⭐ Poll every 2 seconds for real-time updates
    staleTime: 1000, // Consider data stale after 1 second
  });
}

/**
 * Hook for deleting an image via API
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
      const response = await fetch(
        `/api/images?projectId=${projectId}&imageId=${imageId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete image');
      }

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
 * Hook for batch deleting images via API
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
        imageIds.map((imageId) =>
          fetch(`/api/images?projectId=${projectId}&imageId=${imageId}`, {
            method: 'DELETE',
          }).then((res) => {
            if (!res.ok) {
              throw new Error('Failed to delete image');
            }
          })
        )
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
