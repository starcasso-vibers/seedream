/**
 * File upload hook with validation and progress tracking
 * Handles image file uploads with type checking and size limits
 */

import { useState, useCallback } from 'react';

// Validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILES = 3;

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface FileValidationError {
  fileName: string;
  error: string;
}

export interface UseFileUploadOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  onProgress?: (progress: UploadProgress[]) => void;
  onSuccess?: (files: File[]) => void;
  onError?: (errors: FileValidationError[]) => void;
}

export interface UseFileUploadReturn {
  uploadFiles: (files: FileList | File[]) => Promise<File[]>;
  progress: UploadProgress[];
  isUploading: boolean;
  errors: FileValidationError[];
  reset: () => void;
  validateFiles: (files: FileList | File[]) => FileValidationError[];
}

/**
 * Hook for handling file uploads with validation
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxFileSize = MAX_FILE_SIZE,
    allowedTypes = ALLOWED_TYPES,
    maxFiles = MAX_FILES,
    onProgress,
    onSuccess,
    onError,
  } = options;

  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<FileValidationError[]>([]);

  /**
   * Validates files before upload
   */
  const validateFiles = useCallback(
    (files: FileList | File[]): FileValidationError[] => {
      const fileArray = Array.from(files);
      const validationErrors: FileValidationError[] = [];

      // Check number of files
      if (fileArray.length > maxFiles) {
        validationErrors.push({
          fileName: 'multiple',
          error: `Maximum ${maxFiles} files allowed`,
        });
        return validationErrors;
      }

      // Validate each file
      fileArray.forEach((file) => {
        // Check file type
        if (!allowedTypes.includes(file.type)) {
          validationErrors.push({
            fileName: file.name,
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          });
        }

        // Check file size
        if (file.size > maxFileSize) {
          validationErrors.push({
            fileName: file.name,
            error: `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(0)}MB limit`,
          });
        }

        // Check if file is empty
        if (file.size === 0) {
          validationErrors.push({
            fileName: file.name,
            error: 'File is empty',
          });
        }
      });

      return validationErrors;
    },
    [maxFileSize, allowedTypes, maxFiles]
  );

  /**
   * Simulates file upload with progress tracking
   * In production, replace with actual upload to server/storage
   */
  const simulateUpload = useCallback(
    (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        let loaded = 0;

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            loaded = event.loaded;
            const percent = Math.round((event.loaded / event.total) * 100);

            setProgress((prev) =>
              prev.map((p) =>
                p.fileName === file.name
                  ? { ...p, progress: percent, status: 'uploading' as const }
                  : p
              )
            );
          }
        };

        reader.onload = () => {
          setProgress((prev) =>
            prev.map((p) =>
              p.fileName === file.name
                ? { ...p, progress: 100, status: 'success' as const }
                : p
            )
          );
          resolve();
        };

        reader.onerror = () => {
          setProgress((prev) =>
            prev.map((p) =>
              p.fileName === file.name
                ? {
                    ...p,
                    status: 'error' as const,
                    error: 'Failed to read file',
                  }
                : p
            )
          );
          reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
      });
    },
    []
  );

  /**
   * Main upload function
   */
  const uploadFiles = useCallback(
    async (files: FileList | File[]): Promise<File[]> => {
      const fileArray = Array.from(files);

      // Validate files
      const validationErrors = validateFiles(fileArray);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onError?.(validationErrors);
        throw new Error('File validation failed');
      }

      // Initialize progress tracking
      const initialProgress: UploadProgress[] = fileArray.map((file) => ({
        fileName: file.name,
        progress: 0,
        status: 'pending' as const,
      }));

      setProgress(initialProgress);
      setIsUploading(true);
      setErrors([]);

      try {
        // Upload files (simulated for now)
        await Promise.all(fileArray.map((file) => simulateUpload(file)));

        // Notify progress
        onProgress?.(progress);

        // Success callback
        onSuccess?.(fileArray);

        return fileArray;
      } catch (error) {
        const uploadError: FileValidationError = {
          fileName: 'upload',
          error: error instanceof Error ? error.message : 'Upload failed',
        };
        setErrors([uploadError]);
        onError?.([uploadError]);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [validateFiles, simulateUpload, onProgress, onSuccess, onError, progress]
  );

  /**
   * Reset upload state
   */
  const reset = useCallback(() => {
    setProgress([]);
    setIsUploading(false);
    setErrors([]);
  }, []);

  return {
    uploadFiles,
    progress,
    isUploading,
    errors,
    reset,
    validateFiles,
  };
}

/**
 * Utility function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Utility function to get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * Utility function to check if file is image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
