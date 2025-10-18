/**
 * Image Generation Type Definitions
 * Based on Seedream API specifications
 */

export type ImageSize = "2K" | "4K";
export type NumImages = number; // 1-10 range validated by Zod schema

export interface GenerationParams {
  prompt: string;
  size: ImageSize;
  numImages: NumImages;
  watermark: boolean;
  referenceImages?: File[];      // Local files to upload
  projectId: string;             // Project ID (required)
}

export interface ImageMetadata {
  id: string;                    // UUID
  projectId: string;             // Project ID
  prompt: string;                // Original prompt
  size: ImageSize;
  watermark: boolean;
  referenceImages: string[];     // Paths to reference images
  generatedUrl: string;          // Path to generated image
  createdAt: string;             // ISO 8601 datetime
}

export interface ProjectImages {
  projectId: string;
  images: ImageMetadata[];
}

export interface SeedreamApiRequest {
  model: string;
  prompt: string;
  sequential_image_generation: "disabled";
  response_format: "url";
  size: ImageSize;
  stream: false;
  watermark: boolean;
  n: number;
  image?: string[];              // Base64 encoded images
}

export interface SeedreamApiResponse {
  data: Array<{
    url: string;
    b64_json: null;
  }>;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerationResult {
  success: boolean;
  images: ImageMetadata[];
  error?: string;
}
