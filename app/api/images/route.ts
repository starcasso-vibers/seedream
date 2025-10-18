import { NextRequest, NextResponse } from 'next/server';
import { GeneratedImage, Project } from '@/features/types';
import { ImageMetadata } from '@/features/image-generation/types/image';
import { storage } from '@/lib/storage';

// Mark this route as dynamic since it uses searchParams
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Verify project exists
    const projects = await storage.getProjects();
    const projectExists = projects.some(p => p.id === projectId);
    if (!projectExists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const allImages = await storage.getProjectImages(projectId);

    // Transform GeneratedImage[] → ImageMetadata[] for frontend compatibility
    const transformedImages: ImageMetadata[] = allImages.map(img => ({
      id: img.id,
      projectId: img.projectId,
      prompt: img.prompt,
      size: img.size as '2K' | '4K', // Cast to ImageSize type
      watermark: img.metadata?.watermark ?? false,
      referenceImages: [], // Not stored in backend
      generatedUrl: img.url, // KEY FIX: url → generatedUrl
      createdAt: img.createdAt,
    }));

    // Sort by createdAt descending (newest first)
    transformedImages.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const totalImages = transformedImages.length;
    const totalPages = Math.ceil(totalImages / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedImages = transformedImages.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        images: paginatedImages,
        pagination: {
          page,
          limit,
          totalImages,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const imageId = searchParams.get('imageId');

    if (!projectId || !imageId) {
      return NextResponse.json(
        { error: 'projectId and imageId query parameters are required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const projects = await storage.getProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get all images and find the one to delete
    const allImages = await storage.getProjectImages(projectId);
    const imageToDelete = allImages.find(img => img.id === imageId);

    if (!imageToDelete) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete the image from blob storage
    await storage.deleteImage(imageToDelete.url);

    // Remove image from project images
    const updatedImages = allImages.filter(img => img.id !== imageId);
    await storage.setProjectImages(projectId, updatedImages);

    // Update project metadata
    projects[projectIndex].imageCount = updatedImages.length;
    projects[projectIndex].updatedAt = new Date().toISOString();
    await storage.setProjects(projects);

    return NextResponse.json(
      {
        success: true,
        imageId,
        projectId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
