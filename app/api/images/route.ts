import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { GeneratedImage, Project } from '@/features/types';

// Mark this route as dynamic since it uses searchParams
export const dynamic = 'force-dynamic';

async function readProjectImages(projectId: string): Promise<GeneratedImage[]> {
  try {
    const images = await kv.get<GeneratedImage[]>(`project:${projectId}:images`);
    return images || [];
  } catch (error) {
    console.error('Error reading project images from KV:', error);
    return [];
  }
}

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

    // Verify project exists in KV
    const projects = await kv.get<Project[]>('projects');
    const projectExists = projects?.some(p => p.id === projectId);
    if (!projectExists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const allImages = await readProjectImages(projectId);

    // Sort by createdAt descending (newest first)
    allImages.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const totalImages = allImages.length;
    const totalPages = Math.ceil(totalImages / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedImages = allImages.slice(startIndex, endIndex);

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
