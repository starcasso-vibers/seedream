/**
 * Project Management Type Definitions
 * Supports multiple projects (chat rooms) for organizing images
 */

export interface ProjectImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
}

export interface Project {
  id: string;                    // UUID
  name: string;                   // Project name (e.g., "Product Marketing", "Banner Design")
  description?: string;           // Optional description
  coverImage?: string;            // Cover image path (first generated image)
  createdAt: string;             // ISO 8601 datetime
  updatedAt: string;             // ISO 8601 datetime
  imageCount: number;            // Number of images in this project
  images?: ProjectImage[];       // Array of images in this project (for sidebar preview)
}

export interface ProjectMetadata {
  projects: Project[];
  activeProjectId: string | null;  // Currently active project
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface DeleteProjectResponse {
  success: boolean;
  deletedImageCount: number;
}
