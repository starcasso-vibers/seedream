/**
 * Seedream API Client
 * Handles image generation requests to BytePlus ARK API
 */

import { GenerationParams, SeedreamApiResponse } from '../types/image';

const ARK_API_ENDPOINT = 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 60000; // 60 seconds
const MAX_REFERENCE_IMAGES = 3;

/**
 * Encodes a File object to base64 string
 */
export async function encodeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads reference images and returns their base64 encoded strings
 */
export async function uploadReferenceImages(files: File[]): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }

  if (files.length > MAX_REFERENCE_IMAGES) {
    throw new Error(`Maximum ${MAX_REFERENCE_IMAGES} reference images allowed`);
  }

  try {
    const base64Promises = files.map(file => encodeImageToBase64(file));
    return await Promise.all(base64Promises);
  } catch (error) {
    throw new Error(
      `Failed to process reference images: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Creates an AbortSignal with timeout
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Delays execution for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validates API key
 */
function getApiKey(): string {
  const apiKey = process.env.ARK_API_KEY || process.env.NEXT_PUBLIC_ARK_API_KEY;

  if (!apiKey) {
    throw new Error('ARK_API_KEY environment variable is not set');
  }

  return apiKey;
}

/**
 * Generates images using the Seedream API with retry logic
 */
export async function generateImages(
  params: GenerationParams
): Promise<SeedreamApiResponse> {
  const apiKey = getApiKey();

  // Validate reference images
  if (params.referenceImages && params.referenceImages.length > MAX_REFERENCE_IMAGES) {
    throw new Error(`Maximum ${MAX_REFERENCE_IMAGES} reference images allowed`);
  }

  // Convert reference images to base64 if provided
  let refImgBase64: string[] | undefined;
  if (params.referenceImages && params.referenceImages.length > 0) {
    refImgBase64 = await uploadReferenceImages(params.referenceImages);
  }

  const requestBody = {
    model: 'doubao-seepic-pro',
    prompt: params.prompt,
    n: params.numImages || 1,
    size: params.size === '2K' ? '2048x2048' : params.size === '4K' ? '4096x4096' : '1024x1024',
    ...(refImgBase64 && refImgBase64.length > 0 && { ref_img: refImgBase64 }),
    watermark: params.watermark,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const signal = createTimeoutSignal(REQUEST_TIMEOUT);

      const response = await fetch(ARK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorText;
        } catch {
          errorMessage = errorText;
        }

        throw new Error(
          `API request failed (${response.status}): ${errorMessage}`
        );
      }

      const data: SeedreamApiResponse = await response.json();

      // Validate response structure
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid API response format');
      }

      return data;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on validation errors or auth errors
      if (
        lastError.message.includes('Maximum') ||
        lastError.message.includes('ARK_API_KEY') ||
        lastError.message.includes('401') ||
        lastError.message.includes('403')
      ) {
        throw lastError;
      }

      // Retry on network errors, timeouts, and server errors
      if (attempt < MAX_RETRIES) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.warn(
          `Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}. ` +
          `Retrying in ${backoffDelay}ms...`
        );
        await delay(backoffDelay);
        continue;
      }
    }
  }

  throw new Error(
    `Failed to generate images after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Downloads an image from URL and saves it to the project directory
 */
export async function downloadImage(
  url: string,
  projectId: string
): Promise<string> {
  try {
    const signal = createTimeoutSignal(REQUEST_TIMEOUT);

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Failed to download image: HTTP ${response.status}`);
    }

    const blob = await response.blob();

    // Generate filename from URL or use timestamp
    const urlParts = new URL(url);
    const pathParts = urlParts.pathname.split('/');
    const originalFilename = pathParts[pathParts.length - 1] || 'image.png';
    const timestamp = Date.now();
    const filename = `${projectId}_${timestamp}_${originalFilename}`;

    // For browser environment, create object URL
    if (typeof window !== 'undefined') {
      const objectUrl = URL.createObjectURL(blob);
      return objectUrl;
    }

    // For Node.js environment, save to file system
    if (typeof process !== 'undefined') {
      const fs = await import('fs/promises');
      const path = await import('path');

      const projectDir = path.join(process.cwd(), 'projects', projectId);
      await fs.mkdir(projectDir, { recursive: true });

      const filepath = path.join(projectDir, filename);
      const buffer = Buffer.from(await blob.arrayBuffer());
      await fs.writeFile(filepath, buffer);

      return filepath;
    }

    throw new Error('Unsupported environment for file download');

  } catch (error) {
    throw new Error(
      `Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
