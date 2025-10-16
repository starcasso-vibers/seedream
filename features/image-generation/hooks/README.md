# React Query Hooks

Custom React Query hooks for managing projects, image generation, and file uploads in the Seedream application.

## 📁 File Structure

```
hooks/
├── use-projects.ts           # Project CRUD operations
├── use-image-generation.ts   # Image generation and management
├── use-upload.ts             # File upload with validation
├── index.ts                  # Centralized exports
└── README.md                 # This file
```

## 🎯 Features

- ✅ **Type-safe** with full TypeScript support
- ⚡ **Optimistic updates** for better UX
- 🔄 **Automatic cache invalidation**
- 📊 **Progress tracking** for uploads
- 🛡️ **Comprehensive error handling**
- 🎨 **React Query best practices**

## 📦 Installation

These hooks are already integrated into the project. Just import what you need:

```typescript
import {
  useProjects,
  useCreateProject,
  useGenerateImage,
  useFileUpload,
} from '@/features/image-generation/hooks';
```

## 🚀 Usage Examples

### Project Management

#### Fetch all projects

```typescript
import { useProjects } from '@/features/image-generation/hooks';

function ProjectList() {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {projects?.map((project) => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  );
}
```

#### Create a new project

```typescript
import { useCreateProject } from '@/features/image-generation/hooks';
import { useToast } from '@/components/ui/use-toast';

function CreateProjectButton() {
  const createProject = useCreateProject();
  const { toast } = useToast();

  const handleCreate = async () => {
    try {
      await createProject.mutateAsync({
        name: 'New Project',
        description: 'My awesome project',
      });

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  return (
    <button onClick={handleCreate} disabled={createProject.isPending}>
      {createProject.isPending ? 'Creating...' : 'Create Project'}
    </button>
  );
}
```

#### Update a project

```typescript
import { useUpdateProject } from '@/features/image-generation/hooks';

function EditProject({ projectId }: { projectId: string }) {
  const updateProject = useUpdateProject();

  const handleUpdate = async (name: string) => {
    await updateProject.mutateAsync({
      id: projectId,
      data: { name },
    });
  };

  return (
    <input
      type="text"
      onBlur={(e) => handleUpdate(e.target.value)}
      disabled={updateProject.isPending}
    />
  );
}
```

#### Delete a project

```typescript
import { useDeleteProject } from '@/features/image-generation/hooks';

function DeleteProjectButton({ projectId }: { projectId: string }) {
  const deleteProject = useDeleteProject();

  const handleDelete = async () => {
    if (confirm('Are you sure?')) {
      await deleteProject.mutateAsync(projectId);
    }
  };

  return (
    <button onClick={handleDelete} disabled={deleteProject.isPending}>
      Delete
    </button>
  );
}
```

### Image Generation

#### Generate images

```typescript
import { useGenerateImage } from '@/features/image-generation/hooks';
import { useState } from 'react';

function ImageGenerator({ projectId }: { projectId: string }) {
  const [prompt, setPrompt] = useState('');
  const generateImage = useGenerateImage();

  const handleGenerate = async () => {
    const result = await generateImage.mutateAsync({
      prompt,
      size: '4K',
      numImages: 2,
      watermark: true,
      projectId,
    });

    if (result.success) {
      console.log('Generated images:', result.images);
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
      />
      <button
        onClick={handleGenerate}
        disabled={generateImage.isPending}
      >
        {generateImage.isPending ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}
```

#### Fetch project images

```typescript
import { useProjectImages } from '@/features/image-generation/hooks';

function ImageGallery({ projectId }: { projectId: string }) {
  const { data: images, isLoading } = useProjectImages(projectId);

  if (isLoading) return <div>Loading images...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {images?.map((image) => (
        <img
          key={image.id}
          src={image.generatedUrl}
          alt={image.prompt}
          className="w-full h-auto"
        />
      ))}
    </div>
  );
}
```

#### Delete an image

```typescript
import { useDeleteImage } from '@/features/image-generation/hooks';

function ImageCard({ projectId, imageId }: { projectId: string; imageId: string }) {
  const deleteImage = useDeleteImage();

  const handleDelete = async () => {
    await deleteImage.mutateAsync({ projectId, imageId });
  };

  return (
    <button onClick={handleDelete} disabled={deleteImage.isPending}>
      Delete
    </button>
  );
}
```

### File Upload

#### Upload reference images

```typescript
import { useFileUpload } from '@/features/image-generation/hooks';
import { useState } from 'react';

function FileUploader() {
  const {
    uploadFiles,
    progress,
    isUploading,
    errors,
    reset,
  } = useFileUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 3,
    onSuccess: (files) => {
      console.log('Uploaded:', files);
    },
    onError: (errors) => {
      console.error('Upload errors:', errors);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      try {
        await uploadFiles(e.target.files);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Progress indicators */}
      {progress.map((p) => (
        <div key={p.fileName}>
          <span>{p.fileName}</span>
          <progress value={p.progress} max={100} />
          <span>{p.status}</span>
        </div>
      ))}

      {/* Error messages */}
      {errors.map((err) => (
        <div key={err.fileName} className="text-red-500">
          {err.fileName}: {err.error}
        </div>
      ))}

      {/* Reset button */}
      {!isUploading && (progress.length > 0 || errors.length > 0) && (
        <button onClick={reset}>Clear</button>
      )}
    </div>
  );
}
```

#### Validate files before upload

```typescript
import { useFileUpload } from '@/features/image-generation/hooks';

function FileValidator() {
  const { validateFiles } = useFileUpload();

  const handleValidation = (files: FileList) => {
    const errors = validateFiles(files);

    if (errors.length > 0) {
      errors.forEach((err) => {
        console.error(`${err.fileName}: ${err.error}`);
      });
      return false;
    }

    return true;
  };

  return (
    <input
      type="file"
      onChange={(e) => {
        if (e.target.files) {
          handleValidation(e.target.files);
        }
      }}
    />
  );
}
```

## 🔧 Advanced Usage

### Optimistic Updates

All mutation hooks implement optimistic updates for better UX:

```typescript
const deleteImage = useDeleteImage();

// The UI updates immediately, then reverts if the mutation fails
await deleteImage.mutateAsync({ projectId, imageId });
```

### Custom Success/Error Handlers

```typescript
const createProject = useCreateProject();

await createProject.mutateAsync(
  { name: 'New Project' },
  {
    onSuccess: (newProject) => {
      console.log('Created:', newProject);
      // Navigate to project page, show toast, etc.
    },
    onError: (error) => {
      console.error('Failed:', error);
      // Show error message, retry logic, etc.
    },
  }
);
```

### Query Invalidation

Manually invalidate queries when needed:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { projectKeys } from '@/features/image-generation/hooks';

function RefreshButton() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: projectKeys.all });
  };

  return <button onClick={handleRefresh}>Refresh</button>;
}
```

## 🎨 Integration with Zustand Store

The hooks are designed to work seamlessly with Zustand store. When you create a Zustand store for global state, you can sync it with React Query:

```typescript
import { create } from 'zustand';
import { useCreateProject } from '@/features/image-generation/hooks';

interface ProjectStore {
  activeProjectId: string | null;
  setActiveProject: (id: string) => void;
}

const useProjectStore = create<ProjectStore>((set) => ({
  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
}));

// In your component
function ProjectCreator() {
  const createProject = useCreateProject();
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  const handleCreate = async () => {
    const project = await createProject.mutateAsync({
      name: 'New Project',
    });

    // Update Zustand store after successful creation
    setActiveProject(project.id);
  };

  return <button onClick={handleCreate}>Create & Activate</button>;
}
```

## 🛠️ Configuration

### Query Configuration

Default stale time is 5 minutes. Override per hook:

```typescript
const { data } = useProjects({
  staleTime: 1000 * 60 * 10, // 10 minutes
  refetchOnWindowFocus: false,
});
```

### Mutation Configuration

```typescript
const createProject = useCreateProject({
  retry: 3,
  retryDelay: 1000,
});
```

## 🧪 Testing

Example test setup with React Query:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjects } from './use-projects';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('fetches projects', async () => {
  const { result } = renderHook(() => useProjects(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toHaveLength(0);
});
```

## 📝 API Reference

### Project Hooks

- `useProjects()` - Fetch all projects
- `useCreateProject()` - Create new project
- `useUpdateProject()` - Update existing project
- `useDeleteProject()` - Delete project

### Image Hooks

- `useGenerateImage()` - Generate images via Seedream API
- `useProjectImages(projectId)` - Fetch images for a project
- `useDeleteImage()` - Delete single image
- `useBatchDeleteImages()` - Delete multiple images

### Upload Hooks

- `useFileUpload(options)` - Handle file uploads with validation

### Utility Functions

- `formatFileSize(bytes)` - Format bytes to human-readable size
- `getFileExtension(fileName)` - Extract file extension
- `isImageFile(file)` - Check if file is an image

## 🐛 Troubleshooting

### Images not showing after generation

Make sure the `downloadImage` function in `seedream-api.ts` correctly saves images to the expected location.

### Type errors

Ensure all type imports are correct:

```typescript
import type { Project } from '@/features/project-management/types/project';
import type { ImageMetadata } from '@/features/image-generation/types/image';
```

### Cache not updating

Check that query keys are consistent:

```typescript
// ✅ Correct
queryClient.invalidateQueries({ queryKey: projectKeys.all });

// ❌ Wrong - different key
queryClient.invalidateQueries({ queryKey: ['projects'] });
```

## 📚 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [TypeScript + React Query](https://tanstack.com/query/latest/docs/react/typescript)

## 🔜 Future Enhancements

- [ ] Real backend API integration
- [ ] WebSocket support for real-time updates
- [ ] Infinite scroll for image galleries
- [ ] Image compression before upload
- [ ] Retry mechanisms with exponential backoff
- [ ] Offline support with service workers
