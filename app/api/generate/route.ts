import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { GeneratedImage, Project } from '@/features/types';
import { storage } from '@/lib/storage';

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

async function downloadImageBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return await response.arrayBuffer();
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
    const projects = await storage.getProjects();
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

    // Prepare base request body
    const baseRequestBody = {
      model: 'seedream-4-0-250828',
      prompt: prompt,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      size: sizeValue,
      stream: false,
      watermark: watermark,
      n: 1, // Always request 1 image per call (ARK API limitation)
      ...(refImgBase64.length > 0 && {
        image: refImgBase64.map(b64 => `data:image/jpeg;base64,${b64}`)
      }),
    };

    const generatedImages: GeneratedImage[] = [];

    // Generate images sequentially (ARK API doesn't support batch generation)
    for (let i = 0; i < numImages; i++) {
      console.log(`=== Generating image ${i + 1}/${numImages} ===`);
      console.log('Request body:', JSON.stringify(baseRequestBody, null, 2));

      try {
        const arkResponse = await fetch(ARK_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ARK_API_KEY}`,
          },
          body: JSON.stringify(baseRequestBody),
        });

        if (!arkResponse.ok) {
          const errorText = await arkResponse.text();
          console.error(`ARK API Error for image ${i + 1}:`, errorText);

          // Continue with other images even if one fails
          continue;
        }

        const arkData: ArkApiResponse = await arkResponse.json();
        console.log(`Received ${arkData.data.length} image(s) for request ${i + 1}`);

        // Upload each image using storage adapter
        for (const imageData of arkData.data) {
          const imageId = uuidv4();
          const filename = `projects/${projectId}/${imageId}.png`;

          // Download image and upload via storage adapter
          const buffer = await downloadImageBuffer(imageData.url);
          const imageUrl = await storage.uploadImage(buffer, filename);
          console.log(`Uploaded image: ${imageUrl}`);

          // Determine dimensions from size value
          const width = sizeValue === '4K' ? 4096 : 2048;
          const height = width;

          const generatedImage: GeneratedImage = {
            id: imageId,
            projectId,
            filename: `${imageId}.png`,
            url: imageUrl,
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
        }
      } catch (error) {
        console.error(`Error generating image ${i + 1}:`, error);
        // Continue with other images
        continue;
      }
    }

    // Check if any images were generated
    if (generatedImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any images' },
        { status: 500 }
      );
    }

    console.log(`=== Successfully generated ${generatedImages.length} images ===`);

    // Update project images
    const existingImages = await storage.getProjectImages(projectId);
    const allImages = [...existingImages, ...generatedImages];
    await storage.setProjectImages(projectId, allImages);

    // Update project metadata
    const project = projects[projectIndex];
    project.imageCount = allImages.length;
    project.updatedAt = new Date().toISOString();
    await storage.setProjects(projects);

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
