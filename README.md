# SeeDream Frontend

A modern AI-powered image generation platform with project management capabilities, built with Next.js and TypeScript.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

SeeDream is a comprehensive image generation platform that combines AI-powered image creation with robust project management features. Users can organize their creative work into projects (chat rooms), generate images using the Seedream API, and leverage reference images to guide the generation process.

## ✨ Key Features

### Project Management
- **Multiple Projects**: Create and manage multiple projects (chat rooms) for organizing your work
- **Project Gallery**: View all images within each project in an organized gallery
- **Project Switching**: Easily switch between different projects
- **Persistent State**: Project data persists across sessions using Zustand state management

### Image Generation
- **AI-Powered Generation**: Generate high-quality images using the Seedream API
- **Customizable Parameters**:
  - Width and height configuration
  - Number of steps control
  - Guidance scale adjustment
  - Custom seed values
  - Negative prompts
- **Reference Images**: Upload and use reference images to guide generation
- **Batch Generation**: Generate multiple images at once
- **Generation History**: Track all generated images within projects

### User Experience
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and shadcn/ui
- **Real-time Updates**: Instant feedback during image generation
- **Form Validation**: Robust form validation with React Hook Form and Zod
- **Error Handling**: Comprehensive error handling and user feedback
- **Progress Tracking**: Visual progress indicators for generation tasks

## 🛠️ Tech Stack

### Core Framework
- **Next.js 14.2.18** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5** - Type safety

### State Management & Data Fetching
- **Zustand 5.0.2** - Lightweight state management
- **TanStack Query 5.62.7** - Server state management and caching

### UI Components & Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **clsx & tailwind-merge** - Conditional styling

### Forms & Validation
- **React Hook Form 7.65.0** - Form state management
- **Zod 3.25.76** - Schema validation
- **@hookform/resolvers** - Form validation resolvers

### Utilities
- **date-fns 4.1.0** - Date manipulation
- **uuid 11.1.0** - Unique ID generation

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (comes with Node.js)
- **Git**: For version control

Check your versions:
```bash
node --version  # Should be v18.0 or higher
npm --version   # Should be 9.0 or higher
```

## 🚀 Installation

Follow these steps to get the project running on your local machine:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd seedream/frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`. The installation may take a few minutes.

### 3. Verify Installation

After installation completes, verify that all dependencies are installed:

```bash
npm list --depth=0
```

## 🔧 Environment Setup

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

### 2. Configure Environment Variables

Open `.env.local` in your text editor and configure the following variables:

```bash
# Seedream API Configuration
ARK_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Environment Variable Explanations:**

- **`ARK_API_KEY`**: Your Seedream API key for authentication
  - Obtain this from your Seedream account dashboard
  - Keep this secret and never commit to version control

- **`NEXT_PUBLIC_API_URL`**: The backend API URL
  - For local development: `http://localhost:3000/api`
  - For production: Your deployed backend URL
  - The `NEXT_PUBLIC_` prefix makes it available to the browser

### 3. API Key Setup

To obtain your Seedream API key:

1. Visit the Seedream platform
2. Create an account or log in
3. Navigate to your account settings
4. Generate a new API key
5. Copy the key and paste it into your `.env.local` file

## 🏃 Running the Application

### Development Server

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at:
- **URL**: http://localhost:3000
- **Hot Reload**: File changes automatically refresh the browser
- **Terminal Output**: Shows compilation status and errors

### Development Commands

```bash
# Start development server
npm run dev

# Run TypeScript type checking
npm run typecheck

# Run ESLint for code quality
npm run lint

# Fix ESLint issues automatically
npm run lint -- --fix
```

### First Time Access

1. Open your browser
2. Navigate to http://localhost:3000
3. You should see the SeeDream landing page
4. Create your first project to start generating images

## 🏗️ Building for Production

### 1. Build the Application

Create an optimized production build:

```bash
npm run build
```

This command:
- Compiles TypeScript to JavaScript
- Optimizes and minifies code
- Generates static pages where possible
- Creates production-ready bundles in `.next/` directory

### 2. Test Production Build Locally

After building, test the production version:

```bash
npm run start
```

The production server will run at http://localhost:3000

### 3. Deployment Checklist

Before deploying to production:

- [ ] Set production environment variables
- [ ] Update `NEXT_PUBLIC_API_URL` to production API
- [ ] Test all features in production build
- [ ] Verify API key is secure and not in source code
- [ ] Check that `.env.local` is in `.gitignore`
- [ ] Run type checking: `npm run typecheck`
- [ ] Run linting: `npm run lint`
- [ ] Test build locally: `npm run build && npm run start`

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Home page
│   └── providers.tsx            # React Query provider setup
│
├── components/                   # Shared UI components
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx           # Button component
│       ├── card.tsx             # Card component
│       ├── dialog.tsx           # Modal dialog
│       ├── form.tsx             # Form components
│       ├── input.tsx            # Input field
│       ├── select.tsx           # Select dropdown
│       ├── textarea.tsx         # Textarea field
│       ├── toast.tsx            # Toast notifications
│       └── ...                  # Other UI primitives
│
├── features/                     # Feature-based modules
│   ├── image-generation/        # Image generation feature
│   │   ├── components/
│   │   │   ├── GenerationForm.tsx    # Image generation form
│   │   │   └── ImageCard.tsx         # Image display card
│   │   ├── hooks/
│   │   │   └── useImageGeneration.ts # Generation logic
│   │   ├── store/
│   │   │   └── image-store.ts        # Image state management
│   │   └── types/
│   │       └── image.types.ts        # TypeScript types
│   │
│   └── project-management/      # Project management feature
│       ├── components/
│       │   ├── ProjectSidebar.tsx    # Project navigation
│       │   └── ProjectGallery.tsx    # Project image gallery
│       ├── hooks/
│       │   └── useProjects.ts        # Project management logic
│       ├── store/
│       │   └── project-store.ts      # Project state management
│       └── types/
│           └── project.types.ts      # TypeScript types
│
├── hooks/                        # Shared React hooks
│   └── use-toast.ts             # Toast notification hook
│
├── lib/                          # Utility libraries
│   ├── api-client.ts            # API request wrapper
│   ├── utils.ts                 # Helper functions
│   └── validators.ts            # Zod schemas
│
├── public/                       # Static assets
│   └── images/                  # Image files
│
├── docs/                         # Documentation
│   └── architecture.md          # Architecture documentation
│
├── .env.local                    # Environment variables (not in git)
├── .env.local.example           # Environment template
├── next.config.mjs              # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Project dependencies
└── README.md                    # This file
```

### Key Directories Explained

**`app/`**: Next.js 14 App Router structure
- Uses file-based routing
- `layout.tsx` wraps all pages
- `page.tsx` files become routes
- `providers.tsx` sets up global providers

**`features/`**: Feature-based architecture
- Each feature is self-contained
- Contains components, hooks, stores, and types
- Promotes code organization and reusability
- Easy to understand and maintain

**`components/ui/`**: Reusable UI components
- Built on Radix UI primitives
- Styled with Tailwind CSS
- Accessible and customizable
- Follows shadcn/ui patterns

**`lib/`**: Utility functions and helpers
- `api-client.ts`: Centralized API communication
- `utils.ts`: Common helper functions
- `validators.ts`: Zod validation schemas

## 🔌 API Documentation

### API Client

The application uses a centralized API client (`lib/api-client.ts`) for all backend communication.

### Base Configuration

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
```

### API Methods

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const data = await apiClient.get('/endpoint');

// POST request
const result = await apiClient.post('/endpoint', { data });

// PUT request
const updated = await apiClient.put('/endpoint', { data });

// DELETE request
await apiClient.delete('/endpoint');

// PATCH request
const patched = await apiClient.patch('/endpoint', { data });
```

### Available Endpoints

#### Projects

```typescript
// List all projects
GET /api/projects
Response: Project[]

// Get single project
GET /api/projects/:id
Response: Project

// Create project
POST /api/projects
Body: { name: string, description?: string }
Response: Project

// Update project
PUT /api/projects/:id
Body: { name?: string, description?: string }
Response: Project

// Delete project
DELETE /api/projects/:id
Response: { success: boolean }
```

#### Image Generation

```typescript
// Generate image
POST /api/generate
Body: {
  prompt: string
  negative_prompt?: string
  width?: number
  height?: number
  num_steps?: number
  guidance_scale?: number
  seed?: number
  num_images?: number
  reference_image?: File
}
Response: {
  images: Array<{ url: string, seed: number }>
  parameters: GenerationParameters
}

// Get generation history
GET /api/projects/:projectId/images
Response: GeneratedImage[]

// Delete image
DELETE /api/images/:imageId
Response: { success: boolean }
```

### File Upload

For endpoints that accept files (like reference images):

```typescript
import { uploadFile } from '@/lib/api-client';

await uploadFile(
  '/api/upload',
  file,
  (progress) => console.log(`${progress}%`)
);
```

### Error Handling

The API client provides comprehensive error handling:

```typescript
try {
  const data = await apiClient.get('/endpoint');
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.message);
  } else {
    console.error('Network Error:', error.message);
  }
}
```

### Type Definitions

```typescript
// Project type
interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Generated image type
interface GeneratedImage {
  id: string;
  projectId: string;
  url: string;
  prompt: string;
  parameters: GenerationParameters;
  createdAt: Date;
}

// Generation parameters
interface GenerationParameters {
  width: number;
  height: number;
  num_steps: number;
  guidance_scale: number;
  seed?: number;
  negative_prompt?: string;
}
```

## 💻 Development Guide

### Creating a New Feature

1. **Create feature directory**:
```bash
mkdir -p features/my-feature/{components,hooks,store,types}
```

2. **Define types** (`types/my-feature.types.ts`):
```typescript
export interface MyFeature {
  id: string;
  name: string;
}
```

3. **Create store** (`store/my-feature-store.ts`):
```typescript
import { create } from 'zustand';

interface MyFeatureStore {
  items: MyFeature[];
  addItem: (item: MyFeature) => void;
}

export const useMyFeatureStore = create<MyFeatureStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  }))
}));
```

4. **Create hook** (`hooks/useMyFeature.ts`):
```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useMyFeature() {
  return useQuery({
    queryKey: ['my-feature'],
    queryFn: () => apiClient.get('/api/my-feature')
  });
}
```

5. **Create component** (`components/MyFeatureComponent.tsx`):
```typescript
export function MyFeatureComponent() {
  const { data, isLoading } = useMyFeature();

  if (isLoading) return <div>Loading...</div>;

  return <div>{/* Your component */}</div>;
}
```

### Adding a New UI Component

Using shadcn/ui:

```bash
npx shadcn-ui@latest add [component-name]
```

Example:
```bash
npx shadcn-ui@latest add tabs
```

### Form Validation

Example form with validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email')
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* Form fields */}
  </form>;
}
```

### State Management Patterns

**Local state**: Use `useState` for component-specific state

**Server state**: Use TanStack Query for API data

**Global client state**: Use Zustand for cross-component state

Example:
```typescript
// Local state
const [count, setCount] = useState(0);

// Server state
const { data } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects
});

// Global state
const projects = useProjectStore((state) => state.projects);
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: "Cannot find module" errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Environment variables not working

**Symptoms**: API key not recognized, wrong API URL

**Solution**:
1. Ensure `.env.local` exists and is in the project root
2. Restart the development server after changing env vars
3. Verify variable names start with `NEXT_PUBLIC_` for client-side access
4. Check `.env.local` is in `.gitignore`

```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

#### Issue: Build fails with TypeScript errors

**Solution**:
```bash
# Check for type errors
npm run typecheck

# Fix common issues
# 1. Add missing type definitions
npm install --save-dev @types/[package-name]

# 2. Check tsconfig.json is correct
# 3. Ensure all imports have correct paths
```

#### Issue: Styles not applying

**Solution**:
```bash
# Rebuild Tailwind CSS
npm run dev

# If still not working, check:
# 1. tailwind.config.ts includes all content paths
# 2. Global CSS imports Tailwind directives
# 3. No conflicting CSS
```

#### Issue: API requests failing

**Symptoms**: 404, 500, or network errors

**Solution**:
1. Verify backend is running
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Open browser DevTools Network tab to inspect requests
4. Verify API key is correct

```bash
# Test API endpoint manually
curl http://localhost:3000/api/projects

# Check environment variable is loaded
console.log(process.env.NEXT_PUBLIC_API_URL)
```

#### Issue: Hot reload not working

**Solution**:
```bash
# Stop the server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

#### Issue: Out of memory during build

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max_old_space_size=4096" npm run build
```

#### Issue: Port 3000 already in use

**Solution**:
```bash
# Option 1: Use different port
PORT=3001 npm run dev

# Option 2: Kill process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

#### Issue: Images not displaying

**Solution**:
1. Check image URLs are accessible
2. Verify CORS settings on image server
3. Check Next.js `next.config.mjs` includes image domains

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-image-domain.com'],
  },
};
```

### Getting Help

If you encounter issues not covered here:

1. **Check browser console** for JavaScript errors
2. **Check terminal** for build/runtime errors
3. **Review Next.js documentation**: https://nextjs.org/docs
4. **Check package documentation** for specific libraries
5. **Search GitHub issues** for similar problems

### Debug Mode

Enable verbose logging:

```bash
# Enable Next.js debug logging
DEBUG=* npm run dev

# TypeScript verbose
npm run typecheck -- --verbose
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)

## 📝 License

This project is private and proprietary.

---

**Happy coding! 🚀**
