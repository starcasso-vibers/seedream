import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '@/features/types';
import { storage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const projects = await storage.getProjects();
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

    const projects = await storage.getProjects();
    const newProject: Project = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageCount: 0,
    };

    // Initialize empty images array for this project
    await storage.setProjectImages(newProject.id, []);

    projects.push(newProject);
    await storage.setProjects(projects);

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
