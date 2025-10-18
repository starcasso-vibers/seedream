/**
 * Generation Job Type Definitions
 * For tracking async image generation jobs
 */

import type { ImageSize, NumImages } from './image';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;                    // UUID for the job
  projectId: string;             // Project this job belongs to
  prompt: string;                // Generation prompt
  size: ImageSize;               // Image size (2K or 4K)
  numImages: NumImages;          // Number of images (always 1 for individual jobs)
  watermark: boolean;            // Whether to add watermark
  referenceImages?: string[];    // Reference image URLs
  status: JobStatus;             // Current job status
  progress: number;              // Progress percentage (0-100)
  createdAt: string;             // ISO 8601 datetime when job was created
  startedAt?: string;            // ISO 8601 datetime when job started processing
  completedAt?: string;          // ISO 8601 datetime when job completed
  error?: string;                // Error message if failed

  // Batch information (for UI display)
  batchId?: string;              // Batch ID (same for all jobs in one request)
  imageIndex?: number;           // Index of this image in the batch (1-based)
  totalInBatch?: number;         // Total number of images in the batch
}

export interface JobQueueState {
  jobs: GenerationJob[];

  // Actions
  addJob: (job: GenerationJob) => void;
  updateJob: (jobId: string, updates: Partial<GenerationJob>) => void;
  removeJob: (jobId: string) => void;
  getJobsByProject: (projectId: string) => GenerationJob[];
  getActiveJobCount: (projectId: string) => number;
  getAllActiveJobs: () => GenerationJob[];
}
