import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '@/features/types';

const PROJECTS_FILE = path.join(process.cwd(), 'public', 'generated-images', 'projects.json');
const PROJECTS_DIR = path.join(process.cwd(), 'public', 'generated-images', 'projects');

async function ensureProjectsFile(): Promise<void> {
  try {
    await fs.access(PROJECTS_FILE);
  } catch {
    await fs.mkdir(path.dirname(PROJECTS_FILE), { recursive: true });
    await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects: [] }, null, 2));
  }
}

async function readProjects(): Promise<Project[]> {
  await ensureProjectsFile();
  const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  return parsed.projects || [];
}

async function writeProjects(projects: Project[]): Promise<void> {
  await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects }, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const projects = await readProjects();
    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const projects = await readProjects();
    const newProject: Project = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageCount: 0,
    };

    // Create project directory
    const projectDir = path.join(PROJECTS_DIR, newProject.id);
    await fs.mkdir(path.join(projectDir, 'images'), { recursive: true });

    // Create metadata file
    const metadataFile = path.join(projectDir, 'metadata.json');
    await fs.writeFile(
      metadataFile,
      JSON.stringify({ images: [] }, null, 2)
    );

    projects.push(newProject);
    await writeProjects(projects);

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
