/**
 * Redis Storage Adapter
 * Uses Redis for data storage and Vercel Blob for image storage
 */

import { createClient } from 'redis';
import { put, del } from '@vercel/blob';
import type { StorageAdapter } from './adapter';
import type { Project, GeneratedImage } from '@/features/types';

export class RedisStorageAdapter implements StorageAdapter {
  private client = createClient({
    url: process.env.REDIS_URL,
  });

  private async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  private async disconnect() {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  async getProjects(): Promise<Project[]> {
    try {
      await this.connect();
      const data = await this.client.get('projects');
      await this.disconnect();
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Redis getProjects error:', error);
      await this.disconnect();
      return [];
    }
  }

  async setProjects(projects: Project[]): Promise<void> {
    try {
      await this.connect();
      await this.client.set('projects', JSON.stringify(projects));
      await this.disconnect();
    } catch (error) {
      console.error('Redis setProjects error:', error);
      await this.disconnect();
      throw error;
    }
  }

  async getProjectImages(projectId: string): Promise<GeneratedImage[]> {
    try {
      await this.connect();
      const data = await this.client.get(`project:${projectId}:images`);
      await this.disconnect();
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Redis getProjectImages error:', error);
      await this.disconnect();
      return [];
    }
  }

  async setProjectImages(projectId: string, images: GeneratedImage[]): Promise<void> {
    try {
      await this.connect();
      await this.client.set(`project:${projectId}:images`, JSON.stringify(images));
      await this.disconnect();
    } catch (error) {
      console.error('Redis setProjectImages error:', error);
      await this.disconnect();
      throw error;
    }
  }

  async uploadImage(buffer: ArrayBuffer, filename: string): Promise<string> {
    try {
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'image/png',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return blob.url;
    } catch (error) {
      console.error('Blob upload error:', error);
      throw error;
    }
  }

  async deleteImage(url: string): Promise<void> {
    try {
      await del(url, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (error) {
      console.error('Blob delete error:', error);
      // Don't throw - deletion might fail if blob already deleted
    }
  }
}
