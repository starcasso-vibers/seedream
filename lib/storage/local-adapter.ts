/**
 * Local File System Storage Adapter
 * Uses file system for development environment
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { StorageAdapter } from './adapter';
import type { Project, GeneratedImage } from '@/features/types';

export class LocalStorageAdapter implements StorageAdapter {
  private projectsFile = path.join(process.cwd(), 'public', 'generated-images', 'projects.json');
  private imagesDir = path.join(process.cwd(), 'public', 'generated-images', 'projects');

  async getProjects(): Promise<Project[]> {
    try {
      const data = await fs.readFile(this.projectsFile, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.projects || [];
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []; // File doesn't exist yet, return empty array
      }
      throw error;
    }
  }

  async setProjects(projects: Project[]): Promise<void> {
    await fs.mkdir(path.dirname(this.projectsFile), { recursive: true });
    await fs.writeFile(
      this.projectsFile,
      JSON.stringify({ projects }, null, 2)
    );
  }

  async getProjectImages(projectId: string): Promise<GeneratedImage[]> {
    try {
      const imagesFile = path.join(
        process.cwd(),
        'public',
        'generated-images',
        'projects',
        projectId,
        'images.json'
      );
      const data = await fs.readFile(imagesFile, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async setProjectImages(projectId: string, images: GeneratedImage[]): Promise<void> {
    const imagesFile = path.join(
      process.cwd(),
      'public',
      'generated-images',
      'projects',
      projectId,
      'images.json'
    );
    await fs.mkdir(path.dirname(imagesFile), { recursive: true });
    await fs.writeFile(imagesFile, JSON.stringify(images, null, 2));
  }

  async uploadImage(buffer: ArrayBuffer, filename: string): Promise<string> {
    const filepath = path.join(this.imagesDir, filename);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, Buffer.from(buffer));

    // Return public URL
    return `/generated-images/projects/${filename}`;
  }

  async deleteImage(url: string): Promise<void> {
    // Extract filename from URL
    const filename = url.replace('/generated-images/projects/', '');
    const filepath = path.join(this.imagesDir, filename);

    try {
      await fs.unlink(filepath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, ignore
    }
  }
}
