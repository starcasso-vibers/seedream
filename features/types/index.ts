/**
 * Centralized type exports for features
 */

// Project Management types
export type {
  Project,
  ProjectImage,
  ProjectMetadata,
  CreateProjectRequest,
  UpdateProjectRequest,
  DeleteProjectResponse,
} from '@/features/project-management/types/project';

import type { Project } from '@/features/project-management/types/project';

// Image Generation types
export interface GeneratedImage {
  id: string;
  projectId: string;
  filename: string;
  url: string;
  prompt: string;
  size: string;
  width: number;
  height: number;
  createdAt: string;
  metadata?: {
    seedreamRequestId?: string;
    watermark?: boolean;
  };
}

export interface ImageGenerationRequest {
  prompt: string;
  projectId: string;
  size?: string;
  numImages?: number;
  watermark?: boolean;
  referenceImages?: File[];
}

export interface ImageGenerationResponse {
  images: GeneratedImage[];
  project: Project;
}
