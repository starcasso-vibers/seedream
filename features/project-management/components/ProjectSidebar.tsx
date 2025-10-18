'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Image as ImageIcon,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjectStore } from '@/lib/stores/project-store';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ProjectSidebar({ isOpen, onToggle }: ProjectSidebarProps) {
  const { projects, activeProjectId, setActiveProject, addProject, updateProject, deleteProject, getActiveJobCount } =
    useProjectStore();

  // Mobile drawer state (controlled by parent if props provided)
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isControlled = isOpen !== undefined && onToggle !== undefined;
  const sidebarOpen = isControlled ? isOpen : isMobileOpen;
  const toggleSidebar = isControlled ? onToggle : () => setIsMobileOpen(!isMobileOpen);

  // New project dialog state
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null);
  const [renameProjectName, setRenameProjectName] = useState('');

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName('');
      setIsNewProjectDialogOpen(false);
    }
  };

  const handleRenameProject = () => {
    if (renameProjectId && renameProjectName.trim()) {
      updateProject(renameProjectId, { name: renameProjectName.trim() });
      setRenameProjectId(null);
      setRenameProjectName('');
      setRenameDialogOpen(false);
    }
  };

  const handleDeleteProject = () => {
    if (deleteProjectId) {
      deleteProject(deleteProjectId);
      setDeleteProjectId(null);
      setDeleteDialogOpen(false);
    }
  };

  const openRenameDialog = (projectId: string, currentName: string) => {
    setRenameProjectId(projectId);
    setRenameProjectName(currentName);
    setRenameDialogOpen(true);
  };

  const openDeleteDialog = (projectId: string) => {
    setDeleteProjectId(projectId);
    setDeleteDialogOpen(true);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Button
          size="sm"
          onClick={() => setIsNewProjectDialogOpen(true)}
          className="h-8 gap-2"
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      <Separator />

      {/* Projects List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2 py-4">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <ImageIcon className="mb-2 h-12 w-12 opacity-20" />
              <p className="text-sm">No projects yet</p>
              <p className="text-xs">Create your first project to get started</p>
            </div>
          ) : (
            [...projects]
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((project) => {
              const isActive = project.id === activeProjectId;
              const imageCount = project.images?.length || 0;
              const coverImage = project.images?.[0];
              const activeJobsCount = getActiveJobCount(project.id);

              return (
                <Card
                  key={project.id}
                  className={cn(
                    'group relative cursor-pointer overflow-hidden transition-all hover:shadow-md',
                    isActive && 'border-primary ring-2 ring-primary ring-offset-2'
                  )}
                  onClick={() => {
                    setActiveProject(project.id);
                    if (isControlled && onToggle && window.innerWidth < 1024) {
                      onToggle(); // Close sidebar on mobile when project is selected
                    } else {
                      setIsMobileOpen(false);
                    }
                  }}
                >
                  <div className="flex items-start gap-3 p-3">
                    {/* Thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {coverImage ? (
                        <img
                          src={coverImage.url}
                          alt={project.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-medium text-sm leading-tight">
                          {project.name}
                        </h3>

                        {/* Context Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openRenameDialog(project.id, project.name);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(project.id);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Image Count and Active Jobs Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="h-5 text-xs">
                          <ImageIcon className="mr-1 h-3 w-3" />
                          {imageCount}
                        </Badge>
                        {activeJobsCount > 0 && (
                          <Badge variant="default" className="h-5 text-xs bg-primary/90 animate-pulse">
                            🔄 {activeJobsCount} generating
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(project.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
              })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Sidebar Content - full height */}
      <SidebarContent />

      {/* New Project Dialog */}
      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter a name for your new project. You can change it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="My Awesome Project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProject();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Project Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>Enter a new name for this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-project">Project Name</Label>
              <Input
                id="rename-project"
                placeholder="New project name"
                value={renameProjectName}
                onChange={(e) => setRenameProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameProject();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameProject} disabled={!renameProjectName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone. All
              images and data associated with this project will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
