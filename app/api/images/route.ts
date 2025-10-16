import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { GeneratedImage } from '@/features/types';

// Mark this route as dynamic since it uses searchParams
export const dynamic = 'force-dynamic';

const PROJECTS_DIR = path.join(process.cwd(), 'public', 'generated-images', 'projects');

async function readMetadata(projectId: string): Promise<{ images: GeneratedImage[] }> {
  const metadataFile = path.join(PROJECTS_DIR, projectId, 'metadata.json');
  try {
    const data = await fs.readFile(metadataFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { images: [] };
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

    // Verify project directory exists
    const projectDir = path.join(PROJECTS_DIR, projectId);
    try {
      await fs.access(projectDir);
    } catch {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const metadata = await readMetadata(projectId);
    const allImages = metadata.images || [];

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
