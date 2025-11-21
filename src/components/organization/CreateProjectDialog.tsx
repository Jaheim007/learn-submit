import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, FileText } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  classes: Array<{ id: string; name: string }>;
  onProjectCreated: () => void;
}

export default function CreateProjectDialog({
  open,
  onOpenChange,
  organizationId,
  classes,
  onProjectCreated,
}: CreateProjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [resourceFiles, setResourceFiles] = useState<File[]>([]);

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${organizationId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('submito-project-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('submito-project-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleResourceUpload = async (projectId: string, files: File[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('submito-project-resources')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('submito-project-resources')
          .getPublicUrl(fileName);

        await supabase.from('submito_project_resources').insert({
          project_id: projectId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        });
      }
    } catch (error: any) {
      console.error('Error uploading resources:', error);
      toast.error('Failed to upload resource files');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!title.trim()) {
        toast.error('Please enter a project title');
        return;
      }

      if (selectedClasses.length === 0) {
        toast.error('Please select at least one class');
        return;
      }

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const code = `${title.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { data: project, error: projectError } = await supabase
        .from('submito_organization_projects')
        .insert({
          organization_id: organizationId,
          code,
          title: title.trim(),
          description: description.trim() || null,
          image_url: imageUrl,
          deadline_at: deadline || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Assign to classes
      const classAssignments = selectedClasses.map(classId => ({
        project_id: project.id,
        class_id: classId,
      }));

      const { error: assignError } = await supabase
        .from('submito_project_class_assignments')
        .insert(classAssignments);

      if (assignError) throw assignError;

      // Upload resource files
      if (resourceFiles.length > 0) {
        await handleResourceUpload(project.id, resourceFiles);
      }

      toast.success('Project created successfully!');
      resetForm();
      onProjectCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setSelectedClasses([]);
    setImageFile(null);
    setImagePreview("");
    setResourceFiles([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setResourceFiles(prev => [...prev, ...files]);
  };

  const removeResource = (index: number) => {
    setResourceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleClass = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Image</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
              {imagePreview && (
                <div className="relative w-20 h-20">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Resource Files</Label>
            <div className="space-y-2">
              <Input
                type="file"
                multiple
                onChange={handleResourceChange}
                className="hidden"
                id="resources-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('resources-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Resources
              </Button>
              {resourceFiles.length > 0 && (
                <div className="space-y-2">
                  {resourceFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResource(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign to Classes *</Label>
            <div className="grid grid-cols-2 gap-2">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => toggleClass(cls.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedClasses.includes(cls.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-sm font-medium">{cls.name}</span>
                </div>
              ))}
            </div>
            {classes.length === 0 && (
              <p className="text-sm text-muted-foreground">No classes available. Create classes first.</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
