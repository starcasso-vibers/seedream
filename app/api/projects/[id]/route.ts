import { NextRequest, NextResponse } from 'next/server';
import { Project } from '@/features/types';
import { storage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projects = await storage.getProjects();
    const project = projects.find((p) => p.id === params.id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description } = body;

    const projects = await storage.getProjects();
    const projectIndex = projects.findIndex((p) => p.id === params.id);

    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = projects[projectIndex];

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { error: 'Invalid project name' },
          { status: 400 }
        );
      }
      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = typeof description === 'string' ? description.trim() : '';
    }

    project.updatedAt = new Date().toISOString();
    projects[projectIndex] = project;

    await storage.setProjects(projects);

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projects = await storage.getProjects();
    const projectIndex = projects.findIndex((p) => p.id === params.id);

    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete all images for this project
    const images = await storage.getProjectImages(params.id);
    for (const image of images) {
      try {
        await storage.deleteImage(image.url);
      } catch (error) {
        console.error(`Failed to delete image ${image.url}:`, error);
        // Continue deleting other images even if one fails
      }
    }

    // Remove from projects list
    projects.splice(projectIndex, 1);
    await storage.setProjects(projects);

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
