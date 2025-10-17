/**
 * Storage Adapter Interface
 * Provides abstraction for different storage backends
 */

import type { Project, GeneratedImage } from '@/features/types';

export interface StorageAdapter {
  // Projects
  getProjects(): Promise<Project[]>;
  setProjects(projects: Project[]): Promise<void>;

  // Images
  getProjectImages(projectId: string): Promise<GeneratedImage[]>;
  setProjectImages(projectId: string, images: GeneratedImage[]): Promise<void>;

  // Blob storage
  uploadImage(buffer: ArrayBuffer, filename: string): Promise<string>;
  deleteImage(url: string): Promise<void>;
}
