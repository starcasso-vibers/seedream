import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GeneratedImage, Project } from '@/features/types';

const PROJECTS_FILE = path.join(process.cwd(), 'public', 'generated-images', 'projects.json');
const PROJECTS_DIR = path.join(process.cwd(), 'public', 'generated-images', 'projects');
const ARK_API_ENDPOINT = 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';
const ARK_API_KEY = process.env.ARK_API_KEY;

interface ArkApiResponse {
  data: Array<{
    url: string;
    b64_json: null;
  }>;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

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

async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  await fs.writeFile(filepath, Buffer.from(buffer));
}

async function readMetadata(projectId: string): Promise<{ images: GeneratedImage[] }> {
  const metadataFile = path.join(PROJECTS_DIR, projectId, 'metadata.json');
  try {
    const data = await fs.readFile(metadataFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { images: [] };
  }
}

async function writeMetadata(projectId: string, metadata: { images: GeneratedImage[] }): Promise<void> {
  const metadataFile = path.join(PROJECTS_DIR, projectId, 'metadata.json');
  await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const prompt = formData.get('prompt') as string;
    const projectId = formData.get('projectId') as string;
    const size = formData.get('size') as string || '1024x1024';
    const numImages = parseInt(formData.get('numImages') as string || '1');
    const watermark = formData.get('watermark') === 'true';

    // Validation
    if (!prompt || !projectId) {
      return NextResponse.json(
        { error: 'Prompt and projectId are required' },
        { status: 400 }
      );
    }

    if (!ARK_API_KEY) {
      return NextResponse.json(
        { error: 'ARK API key not configured' },
        { status: 500 }
      );
    }

    // Verify project exists
    const projects = await readProjects();
    const projectIndex = projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Process reference images - convert to base64
    const referenceImages = formData.getAll('referenceImages');
    const refImgBase64: string[] = [];

    for (const image of referenceImages) {
      if (image instanceof File) {
        const buffer = await image.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        refImgBase64.push(base64);
      }
    }

    // Keep size as "2K" or "4K" (API expects these values, not pixel dimensions)
    let sizeValue = '2K';
    if (size === '4K') sizeValue = '4K';

    // Call ARK API with correct parameters
    const requestBody = {
      model: 'seedream-4-0-250828',
      prompt: prompt,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      size: sizeValue,
      stream: false,
      watermark: watermark,
      n: numImages,
      ...(refImgBase64.length > 0 && {
        image: refImgBase64.map(b64 => `data:image/jpeg;base64,${b64}`)
      }),
    };

    const arkResponse = await fetch(ARK_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!arkResponse.ok) {
      const errorText = await arkResponse.text();
      console.error('ARK API Error:', errorText);
      let errorMessage = 'Failed to generate images';

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: arkResponse.status }
      );
    }

    const arkData: ArkApiResponse = await arkResponse.json();

    // Download and save images
    const imagesDir = path.join(PROJECTS_DIR, projectId, 'images');
    await fs.mkdir(imagesDir, { recursive: true });

    const generatedImages: GeneratedImage[] = [];
    const downloadPromises = arkData.data.map(async (imageData) => {
      const imageId = uuidv4();
      const filename = `${imageId}.png`;
      const filepath = path.join(imagesDir, filename);

      await downloadImage(imageData.url, filepath);

      // Determine dimensions from size value
      const width = sizeValue === '4K' ? 4096 : 2048;
      const height = width;

      const generatedImage: GeneratedImage = {
        id: imageId,
        projectId,
        filename,
        url: `/generated-images/projects/${projectId}/images/${filename}`,
        prompt,
        size,
        width,
        height,
        createdAt: new Date().toISOString(),
        metadata: {
          seedreamRequestId: arkData.created.toString(),
          watermark,
        },
      };

      generatedImages.push(generatedImage);
    });

    await Promise.all(downloadPromises);

    // Update metadata.json
    const metadata = await readMetadata(projectId);
    metadata.images.push(...generatedImages);
    await writeMetadata(projectId, metadata);

    // Update project
    const project = projects[projectIndex];
    project.imageCount = metadata.images.length;
    project.updatedAt = new Date().toISOString();
    await writeProjects(projects);

    return NextResponse.json(
      {
        images: generatedImages,
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating images:', error);
    return NextResponse.json(
      { error: 'Failed to generate images' },
      { status: 500 }
    );
  }
}
