import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateUniqueCode } from '@/lib/utils';

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onCourseCreated: () => void;
}

export function CreateCourseDialog({ open, onOpenChange, organizationId, onCourseCreated }: CreateCourseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
  });

  useEffect(() => {
    if (open) {
      loadClasses();
    }
  }, [open, organizationId]);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const { data, error } = await supabase
        .from('submito_organization_classes')
        .select('id, name, code')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('project-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.classId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique code from title
      const generatedCode = generateUniqueCode(formData.title);

      const { data: courseData, error: courseError } = await supabase
        .from('submito_organization_courses')
        .insert({
          organization_id: organizationId,
          title: formData.title,
          code: generatedCode,
          description: formData.description || null,
          image_url: imageUrl,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Link course to class
      const { error: linkError } = await supabase
        .from('submito_organization_class_courses')
        .insert({
          class_id: formData.classId,
          course_id: courseData.id,
        });

      if (linkError) throw linkError;

      // Create notification for all students
      const { data: students } = await supabase
        .from('submito_organization_students')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (students && students.length > 0) {
        const notifications = students.map(student => ({
          user_id: student.user_id,
          type: 'course_created',
          title: 'New Course Available',
          body: `A new course "${formData.title}" has been published`,
          metadata: {
            course_title: formData.title,
            course_code: generatedCode,
            organization_id: organizationId
          }
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast.success(`Course created with code: ${generatedCode}`);
      setFormData({ title: '', description: '', classId: '' });
      setImageUrl(null);
      onOpenChange(false);
      onCourseCreated();
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Course</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new course to your organization
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingClasses ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : classes.length === 0 ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">
                No classes available. Please create a class before creating a course.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="classId" className="text-foreground">Assign to Class *</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  required
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Web Development Fundamentals"
                  className="bg-background/50"
                  required
                />
                <p className="text-xs text-muted-foreground">A unique code will be generated automatically</p>
              </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the course..."
              className="bg-background/50 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="text-foreground">Course Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="bg-background/50"
                disabled={uploading}
              />
              {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />
            )}
          </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || classes.length === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Course'
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
