import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClassSelectionProvider } from "@/components/ClassSelectionProvider";
import { DeadlineWarning } from "@/components/DeadlineWarning";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Link, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";

const submissionSchema = z.object({
  link1: z.string().url("URL invalide").optional().or(z.literal("")),
  link2: z.string().url("URL invalide").optional().or(z.literal("")),
  link3: z.string().url("URL invalide").optional().or(z.literal("")),
  description: z.string().optional(),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export default function SubmitProject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get the selected class from context
  const { data: studentData } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const selectedClassId = studentData?.primary_class_id;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      
      const { data, error } = await supabase
        .from('class_projects')
        .select(`
          project:projects(*)
        `)
        .eq('class_id', selectedClassId);
      
      if (error) throw error;
      return data.map(cp => cp.project).filter(Boolean);
    },
    enabled: !!selectedClassId
  });

  // Check existing submissions for versioning
  const { data: existingSubmissions = [] } = useQuery({
    queryKey: ['existing-submissions', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId || !studentData?.id) return [];
      
      const { data, error } = await supabase
        .from('submissions')
        .select('project_id, version, status')
        .eq('student_id', studentData.id)
        .eq('class_id', selectedClassId)
        .eq('is_latest', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClassId && !!studentData?.id
  });

  const handleSubmissionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['existing-submissions'] });
    queryClient.invalidateQueries({ queryKey: ['student-submissions'] });
  };

  if (isLoading) {
    return (
      <ClassSelectionProvider>
        <div className="container mx-auto p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </ClassSelectionProvider>
    );
  }

  if (!selectedClassId) {
    return (
      <ClassSelectionProvider>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Sélection de classe requise</h3>
              <p className="text-muted-foreground">Veuillez sélectionner votre classe pour voir les projets disponibles.</p>
            </CardContent>
          </Card>
        </div>
      </ClassSelectionProvider>
    );
  }

  return (
    <ClassSelectionProvider>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Soumettre un projet</h1>
          <p className="text-muted-foreground">Choisissez un projet et soumettez votre travail</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Projets disponibles</h2>
          {projects.map((project) => {
            const existingSubmission = existingSubmissions.find(s => s.project_id === project.id);
            return (
              <ProjectCard 
                key={project.id} 
                project={project} 
                classId={selectedClassId}
                existingSubmission={existingSubmission}
                onSubmissionSuccess={handleSubmissionSuccess}
              />
            );
          })}
        </div>
      </div>
    </ClassSelectionProvider>
  );
}

interface ProjectCardProps {
  project: any;
  classId: number;
  existingSubmission?: any;
  onSubmissionSuccess: () => void;
}

const ProjectCard = ({ project, classId, existingSubmission, onSubmissionSuccess }: ProjectCardProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    file1: null,
    file2: null,
    file3: null,
  });

  // Check deadline and resubmission limits
  const now = new Date();
  const isAfterDeadline = project.deadline_at && new Date(project.deadline_at) < now;
  const canResubmit = project.allow_resubmit && existingSubmission;
  const resubmitCount = existingSubmission?.version || 0;
  const hasReachedMaxResubmits = canResubmit && resubmitCount >= project.max_resubmits;
  const canSubmit = !isAfterDeadline && (!existingSubmission || (canResubmit && !hasReachedMaxResubmits));

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      link1: "",
      link2: "",
      link3: "",
      description: "",
    },
  });

  const { data: studentData } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const handleFileChange = (fileKey: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [fileKey]: file }));
  };

  const uploadFile = async (file: File, fileKey: string): Promise<string | null> => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user?.id}/${classId}/${project.id}/${fileName}`;

    const { error } = await supabase.storage
      .from('submissions')
      .upload(filePath, file);

    if (error) throw error;
    return filePath;
  };

  const onSubmit = async (formData: SubmissionFormData) => {
    if (!studentData) {
      toast.error("Profil étudiant introuvable");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files
      const uploadedFiles: { [key: string]: string | null } = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          uploadedFiles[`${key}_url`] = await uploadFile(file, key);
        }
      }

      // Mark previous submission as not latest
      if (existingSubmission) {
        await supabase
          .from('submissions')
          .update({ is_latest: false })
          .eq('student_id', studentData.id)
          .eq('project_id', project.id)
          .eq('class_id', classId)
          .eq('is_latest', true);
      }

      const nextVersion = existingSubmission ? existingSubmission.version + 1 : 1;
      const submissionData = {
        student_id: studentData.id,
        class_id: classId,
        project_id: project.id,
        ...formData,
        ...uploadedFiles,
        version: nextVersion,
        is_latest: true,
      };

      const { data, error } = await supabase
        .from('submissions')
        .insert(submissionData)
        .select()
        .single();

      if (error) {
        console.error('Submission error:', error);
        toast.error("Erreur lors de la soumission: " + error.message);
        return;
      }

      // Create notification for admins about new submission
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            user_id: studentData.user_id, // This will be used to get admin users
            type: 'submission_created',
            title: `Nouvelle soumission - ${project.title}`,
            body: `${studentData.full_name || 'Un étudiant'} a soumis le projet "${project.title}"`,
            metadata: {
              submission_id: data.id,
              project_id: project.id,
              student_id: studentData.id,
              version: nextVersion
            }
          }
        });
      } catch (notifError) {
        console.warn('Failed to create notification:', notifError);
      }

      const isResubmission = nextVersion > 1;
      toast.success(
        isResubmission 
          ? `Projet resoumis avec succès! (Version ${nextVersion})`
          : "Projet soumis avec succès!"
      );
      form.reset();
      setFiles({ file1: null, file2: null, file3: null });
      onSubmissionSuccess();

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error("Erreur lors de la soumission: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {project.title}
                {existingSubmission && (
                  <Badge variant="secondary">
                    {existingSubmission.status === 'Reçu' && <RefreshCw className="w-3 h-3 mr-1" />}
                    Version {existingSubmission.version}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </div>
            {!canSubmit && isAfterDeadline && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Échéance dépassée
              </Badge>
            )}
            {!canSubmit && hasReachedMaxResubmits && (
              <Badge variant="destructive" className="ml-2">
                Limite atteinte
              </Badge>
            )}
          </div>
          
          {project.deadline_at && (
            <DeadlineWarning deadline={project.deadline_at} className="mt-2" />
          )}
          
          {existingSubmission && project.allow_resubmit && (
            <div className="text-sm text-muted-foreground mt-2">
              Resoumissions autorisées: {resubmitCount}/{project.max_resubmits}
            </div>
          )}
        </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="link1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lien 1</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="link2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lien 2</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="link3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lien 3</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(files).map(([key, file], index) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-2">
                    Fichier {index + 1}
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip,.rar"
                    onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                  />
                  {file && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.name}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez votre projet..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting 
                ? "Soumission en cours..." 
                : existingSubmission && canResubmit
                  ? `Resoumettre (Version ${resubmitCount + 1})`
                  : "Soumettre le projet"
              }
            </Button>
            
            {!canSubmit && (
              <div className="text-sm text-muted-foreground text-center">
                {isAfterDeadline 
                  ? "La date limite de soumission est dépassée"
                  : hasReachedMaxResubmits
                    ? "Nombre maximum de resoumissions atteint"
                    : "Soumission non autorisée"
                }
              </div>
            )}
          </CardContent>
        </form>
      </Form>
    </Card>
  );
};