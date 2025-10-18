"use client"

import React from 'react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { GenerationJob } from '../types/generation-job';

interface LoadingCardProps {
  job: GenerationJob;
}

export function LoadingCard({ job }: LoadingCardProps) {
  const getStatusColor = () => {
    switch (job.status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'failed':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'pending':
        return 'Queued';
      case 'processing':
        return 'Generating';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden bg-muted/50">
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <div className="space-y-2 px-4">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className={getStatusColor()}>
                    {getStatusText()}
                  </Badge>
                  {job.totalInBatch && job.totalInBatch > 1 ? (
                    <span className="text-sm text-muted-foreground">
                      Image {job.imageIndex}/{job.totalInBatch}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {job.numImages} {job.numImages === 1 ? 'image' : 'images'}
                    </span>
                  )}
                </div>
                {job.status === 'processing' && (
                  <div className="space-y-1">
                    <Progress value={job.progress} className="h-2 w-48 mx-auto" />
                    <p className="text-xs text-muted-foreground">{job.progress}%</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <p className="line-clamp-2 text-sm text-foreground/80">
          {job.prompt}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
            {job.size}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
            {format(new Date(job.createdAt), 'MMM d, yyyy')}
          </span>
          {job.watermark && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              Watermark
            </span>
          )}
          {job.error && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-red-600 dark:text-red-400">
              Error: {job.error}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
