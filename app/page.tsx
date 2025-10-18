"use client";

import { ProjectSidebar } from "@/features/project-management/components/ProjectSidebar";
import { GenerationForm } from "@/features/image-generation/components/GenerationForm";
import { ProjectGallery } from "@/features/project-management/components/ProjectGallery";
import { useProjectStore } from "@/lib/stores/project-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useGenerateImage, useProjectImages, useDeleteImage } from "@/features/image-generation/hooks/use-image-generation";
import { useToast } from "@/hooks/use-toast";
import type { GenerationParams } from "@/features/image-generation/types/image";

/**
 * Home page - Main application interface
 * Layout: Sidebar + Main Content (Generation Form + Project Gallery)
 */
export default function HomePage() {
  const { activeProjectId, projects, loadProjects } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  // Load projects from server on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Image generation and management hooks
  const generateMutation = useGenerateImage();
  const { data: images = [], isLoading: imagesLoading } = useProjectImages(
    activeProject?.id || ''
  );
  const deleteMutation = useDeleteImage();

  // Handle image generation (async/non-blocking)
  const handleGenerate = async (values: any) => {
    if (!activeProject) {
      toast({
        title: "No Active Project",
        description: "Please select or create a project first",
        variant: "destructive",
      });
      return;
    }

    try {
      const params: GenerationParams = {
        prompt: values.prompt,
        size: values.size,
        numImages: parseInt(values.numberOfImages) as 1 | 2 | 3 | 4,
        watermark: false,
        referenceImages: values.referenceImages,
        projectId: activeProject.id,
      };

      // Generation is now async - job is queued immediately
      const { jobId } = await generateMutation.mutateAsync(params);

      toast({
        title: "Generation Started",
        description: "Your images are being generated. You can continue working while we process your request.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start generation",
        variant: "destructive",
      });
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId: string) => {
    if (!activeProject) return;

    try {
      await deleteMutation.mutateAsync({
        projectId: activeProject.id,
        imageId,
      });

      toast({
        title: "Image Deleted",
        description: "Image has been successfully removed",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Project Sidebar - Collapsible on mobile */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-80 bg-background border-r
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${!sidebarOpen && "lg:w-0 lg:border-0"}
        `}
      >
        <ProjectSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl space-y-6">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden mb-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {sidebarOpen ? "Close Projects" : "Open Projects"}
          </button>

          {/* No Active Project Warning */}
          {!activeProject && (
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-700 dark:text-amber-400">
                No Active Project
              </AlertTitle>
              <AlertDescription className="text-amber-600 dark:text-amber-300">
                Please select or create a project from the sidebar to start generating images.
              </AlertDescription>
            </Alert>
          )}

          {/* Generation Form */}
          <section className="w-full">
            <GenerationForm
              activeProject={activeProject ? {
                id: activeProject.id,
                name: activeProject.name
              } : undefined}
              onSubmit={handleGenerate}
              disabled={!activeProject || generateMutation.isPending}
            />
          </section>

          {/* Project Gallery */}
          {activeProject && (
            <section className="w-full">
              <ProjectGallery
                projectId={activeProject.id}
                images={images}
                isLoading={imagesLoading}
                onDeleteImage={handleDeleteImage}
              />
            </section>
          )}

          {/* Empty State when no active project */}
          {!activeProject && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="space-y-4 max-w-md">
                <h2 className="text-2xl font-semibold text-muted-foreground">
                  Get Started
                </h2>
                <p className="text-sm text-muted-foreground">
                  Create a new project or select an existing one to begin generating
                  AI-powered images. Your projects help organize and manage your
                  creative work.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
