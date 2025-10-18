"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(1500, "Prompt must be 1500 characters or less"),
  size: z.enum(["2K", "4K"], {
    required_error: "Please select an image size",
  }),
  numberOfImages: z
    .number()
    .min(1, "At least 1 image required")
    .max(10, "Maximum 10 images allowed"),
  referenceImages: z
    .array(z.instanceof(File))
    .max(3, "Maximum 3 reference images allowed")
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GenerationFormProps {
  activeProject?: {
    id: string;
    name: string;
  };
  onSubmit?: (values: FormValues) => Promise<void>;
  disabled?: boolean;
}

export function GenerationForm({ activeProject, onSubmit, disabled = false }: GenerationFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      size: "2K",
      numberOfImages: 1,
      referenceImages: [],
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Please upload JPEG, PNG, or WebP images.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size exceeds 5MB limit.`);
        return;
      }
      validFiles.push(file);
    });

    const totalFiles = uploadedFiles.length + validFiles.length;
    if (totalFiles > 3) {
      errors.push("Maximum 3 reference images allowed.");
      const remainingSlots = 3 - uploadedFiles.length;
      validFiles.splice(remainingSlots);
    }

    if (errors.length > 0) {
      toast({
        title: "Upload Error",
        description: errors.join("\n"),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      const newFiles = [...uploadedFiles, ...validFiles];
      setUploadedFiles(newFiles);
      form.setValue("referenceImages", newFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    form.setValue("referenceImages", newFiles);
  };

  const handleFormSubmit = async (values: FormValues) => {
    if (!onSubmit) {
      toast({
        title: "No Handler",
        description: "Image generation handler not configured",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      await onSubmit(values);

      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: "Generation Complete",
        description: `Successfully generated ${values.numberOfImages} image${
          values.numberOfImages === 1 ? "" : "s"
        }`,
      });

      // Reset form
      form.reset();
      setUploadedFiles([]);
      setProgress(0);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred during generation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {activeProject && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active Project:</span>
          <Badge variant="secondary" className="font-medium">
            {activeProject.name}
          </Badge>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <div className="space-y-3 rounded-lg border bg-card p-4">
                    <Textarea
                      placeholder="Describe the image you want to generate..."
                      className="min-h-[120px] resize-none border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      maxLength={1500}
                      {...field}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                      <span>{field.value.length}/1500</span>
                    </div>

                    {/* Options integrated below prompt */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-3">
                      {/* Image Size */}
                      <FormField
                        control={form.control}
                        name="size"
                        render={({ field: sizeField }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs">Image Size</FormLabel>
                            <Select onValueChange={sizeField.onChange} defaultValue={sizeField.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="2K">2K</SelectItem>
                                <SelectItem value="4K">4K</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      {/* Number of Images */}
                      <FormField
                        control={form.control}
                        name="numberOfImages"
                        render={({ field: numField }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-xs">
                              Number of Images ({numField.value})
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                className="h-9"
                                {...numField}
                                onChange={(e) => numField.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Reference Images Button */}
                      <div className="space-y-1">
                        <FormLabel className="text-xs">Reference Images</FormLabel>
                        <label htmlFor="file-upload" className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground">
                          <Upload className="h-4 w-4" />
                          <span>{uploadedFiles.length > 0 ? `${uploadedFiles.length} selected` : 'Upload'}</span>
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          accept={ACCEPTED_IMAGE_TYPES.join(",")}
                          className="hidden"
                          onChange={(e) => handleFileSelect(e.target.files)}
                          disabled={uploadedFiles.length >= 3}
                        />
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reference Images Preview (if any) */}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          )}

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Generating images...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isGenerating || disabled}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Images"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
