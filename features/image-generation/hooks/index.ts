/**
 * React Query hooks exports
 * Centralized export point for all image generation and project management hooks
 */

// Project management hooks
export {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  projectKeys,
} from './use-projects';

// Image generation hooks
export {
  useGenerateImage,
  useProjectImages,
  useDeleteImage,
  useBatchDeleteImages,
  imageKeys,
} from './use-image-generation';

// File upload hooks and utilities
export {
  useFileUpload,
  formatFileSize,
  getFileExtension,
  isImageFile,
} from './use-upload';

// Re-export types for convenience
export type {
  UploadProgress,
  FileValidationError,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from './use-upload';
