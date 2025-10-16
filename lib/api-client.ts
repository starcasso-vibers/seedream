/**
 * API Client for backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Generic API request handler
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        response.statusText,
        errorData.message || "An error occurred"
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(
      error instanceof Error ? error.message : "Network error occurred"
    );
  }
}

/**
 * API client methods
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),

  patch: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
};

/**
 * Upload file with progress tracking
 */
export async function uploadFile(
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.response));
      } else {
        reject(new ApiError(xhr.status, xhr.statusText, xhr.response));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error occurred"));
    });

    xhr.open("POST", `${API_URL}${endpoint}`);
    xhr.send(formData);
  });
}
