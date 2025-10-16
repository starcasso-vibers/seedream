"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageMetadata } from '../types/image';

interface ImageCardProps {
  image: ImageMetadata;
  onDelete?: (imageId: string) => void;
}

export function ImageCard({ image, onDelete }: ImageCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(image.generatedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(image.id);
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={image.generatedUrl}
              alt={image.prompt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <p className="line-clamp-2 text-sm text-foreground/80">
            {image.prompt}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              {image.size}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              {format(new Date(image.createdAt), 'MMM d, yyyy')}
            </span>
            {image.watermark && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                Watermark
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 p-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
