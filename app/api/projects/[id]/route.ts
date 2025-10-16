import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Project } from '@/features/types';

const PROJECTS_FILE = path.join(process.cwd(), 'public', 'generated-images', 'projects.json');
const PROJECTS_DIR = path.join(process.cwd(), 'public', 'generated-images', 'projects');

async function readProjects(): Promise<Project[]> {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.projects || [];
  } catch {
    return [];
  }
}

async function writeProjects(projects: Project[]): Promise<void> {
  await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects }, null, 2));
}

async function deleteDirectory(dirPath: string): Promise<void> {
  try {
    const stats = await fs.stat(dirPath);
    if (stats.isDirectory()) {
      const files = await fs.readdir(dirPath);
      await Promise.all(
        files.map((file) => deleteDirectory(path.join(dirPath, file)))
      );
      await fs.rmdir(dirPath);
    } else {
      await fs.unlink(dirPath);
    }
  } catch (error) {
    // Ignore errors if file/dir doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projects = await readProjects();
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

    const projects = await readProjects();
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

    await writeProjects(projects);

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
    const projects = await readProjects();
    const projectIndex = projects.findIndex((p) => p.id === params.id);

    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete project directory and all images
    const projectDir = path.join(PROJECTS_DIR, params.id);
    await deleteDirectory(projectDir);

    // Remove from projects list
    projects.splice(projectIndex, 1);
    await writeProjects(projects);

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
