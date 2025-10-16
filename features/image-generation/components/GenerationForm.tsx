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
    .max(500, "Prompt must be 500 characters or less"),
  size: z.enum(["2K", "4K"], {
    required_error: "Please select an image size",
  }),
  numberOfImages: z.enum(["1", "2", "3", "4"], {
    required_error: "Please select number of images",
  }),
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
      numberOfImages: "1",
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
          values.numberOfImages === "1" ? "" : "s"
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
                  <Textarea
                    placeholder="Describe the image you want to generate..."
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                    {...field}
                  />
                </FormControl>
                <div className="flex justify-between items-center">
                  <FormMessage />
                  <span className="text-xs text-muted-foreground">
                    {field.value.length}/500
                  </span>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image Size</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select image size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="2K">2K (2048x2048)</SelectItem>
                    <SelectItem value="4K">4K (4096x4096)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numberOfImages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Images</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4"
                  >
                    {["1", "2", "3", "4"].map((num) => (
                      <div key={num} className="flex items-center space-x-2">
                        <RadioGroupItem value={num} id={`num-${num}`} />
                        <FormLabel htmlFor={`num-${num}`} className="cursor-pointer font-normal">
                          {num}
                        </FormLabel>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Reference Images (Optional)</FormLabel>
            <FormDescription>Upload up to 3 reference images (max 5MB each)</FormDescription>
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm">
                  <label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline">
                    Click to upload
                  </label>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, or WebP (max 5MB)
                </p>
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

            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
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
          </FormItem>

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
