"use client"

import React from 'react';
import { ImageCard } from '@/features/image-generation/components/ImageCard';
import { LoadingCard } from '@/features/image-generation/components/LoadingCard';
import { ImageMetadata } from '@/features/image-generation/types/image';
import { useProjectStore } from '@/lib/stores/project-store';
import { useJobProgressSimulation } from '@/features/image-generation/hooks/use-image-generation';

interface ProjectGalleryProps {
  images: ImageMetadata[];
  projectId: string | null;
  isLoading?: boolean;
  onDeleteImage?: (imageId: string) => void;
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border bg-card"
        >
          <div className="aspect-square bg-muted" />
          <div className="p-4">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
            <div className="mt-4 flex gap-2">
              <div className="h-8 flex-1 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  projectId: string | null;
}

function EmptyState({ projectId }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-10 w-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No images yet</h3>
          <p className="text-sm text-muted-foreground">
            {projectId
              ? "Start generating images to see them here. Your creative journey begins with a single prompt."
              : "Select a project to view its images."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProjectGallery({
  images,
  projectId,
  isLoading = false,
  onDeleteImage,
}: ProjectGalleryProps) {
  const { jobs } = useProjectStore();

  // Enable job progress simulation
  useJobProgressSimulation();

  // Get active jobs for current project (pending or processing)
  const activeJobs = React.useMemo(() => {
    if (!projectId) return [];
    return jobs
      .filter(
        (job) =>
          job.projectId === projectId &&
          (job.status === 'pending' || job.status === 'processing')
      )
      .sort((a, b) => {
        // Sort by latest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [jobs, projectId]);

  // Filter images by active project
  const filteredImages = React.useMemo(() => {
    if (!projectId) return [];
    return images
      .filter((image) => image.projectId === projectId)
      .sort((a, b) => {
        // Sort by latest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [images, projectId]);

  if (isLoading) {
    return <GallerySkeleton />;
  }

  if (filteredImages.length === 0 && activeJobs.length === 0) {
    return <EmptyState projectId={projectId} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activeJobs.length > 0 && (
            <span className="mr-3 text-primary">
              {activeJobs.length} generating
            </span>
          )}
          {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Loading cards first (at top of gallery) */}
        {activeJobs.map((job) => (
          <LoadingCard key={job.id} job={job} />
        ))}

        {/* Then actual images (latest first) */}
        {filteredImages.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onDelete={onDeleteImage}
          />
        ))}
      </div>
    </div>
  );
}
