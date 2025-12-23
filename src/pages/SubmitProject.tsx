import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeadlineCountdown } from '@/components/DeadlineCountdown';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Plus, X, Link as LinkIcon, FileText } from 'lucide-react';

interface Project {
  id: number;
  code: string;
  title: string;
  description: string;
  due_at: string | null;
  deadline_at: string | null;
  image_url: string | null;
}

export default function SubmitProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  
  // Dynamic links
  const [links, setLinks] = useState<string[]>(['']);
  
  // Dynamic files
  const [files, setFiles] = useState<File[]>([]);
  
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (user && projectId) {
      fetchProjectData();
    }
  }, [user, projectId]);

  const fetchProjectData = async () => {
    try {
      // Get student data
      const { data: studentData } = await supabase
        .from('students')
        .select('id, primary_class_id')
        .eq('user_id', user?.id)
        .single();

      if (!studentData) {
        toast.error('Profil étudiant non trouvé');
        navigate('/etudiant/projets');
        return;
      }

      setStudentId(studentData.id);
      setClassId(studentData.primary_class_id);

      // Get project data
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', parseInt(projectId!))
        .single();

      if (!projectData) {
        toast.error('Projet non trouvé');
        navigate('/etudiant/projets');
        return;
      }

      setProject(projectData);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const addLink = () => {
    setLinks([...links, '']);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const sanitizeFilename = (filename: string): string => {
    // Remove accents and special characters
    const withoutAccents = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Replace spaces and special chars with underscores, keep only alphanumeric, dots, dashes, underscores
    const sanitized = withoutAccents.replace(/[^a-zA-Z0-9._-]/g, '_');
    return sanitized;
  };

  const buildStoragePath = (file: File): string => {
    const name = file.name;
    const dot = name.lastIndexOf('.');
    const ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : 'bin';
    const base = dot > -1 ? name.slice(0, dot) : name;
    const safeBase = sanitizeFilename(base).replace(/\.+$/,'').slice(0, 60) || 'file';
    const ts = Date.now();
    const uid = user?.id ?? 'unknown';
    return `${uid}/${projectId}/${ts}_${safeBase}.${ext}`;
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('submissions')
      .upload(path, file);

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('invalid key')) {
        throw new Error('Nom de fichier non valide. Renommez-le sans accents, apostrophes ou caractères spéciaux (ex: capture_2025.png).');
      }
      throw error;
    }
    return data.path;
  };

  // Check if deadline has expired
  const isDeadlineExpired = project?.deadline_at && new Date(project.deadline_at) < new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Block submission if deadline has expired
    if (isDeadlineExpired) {
      toast.error('Le délai de soumission est expiré. Vous ne pouvez plus soumettre ce projet.');
      return;
    }
    
    if (!studentId || !classId) {
      toast.error('Données manquantes');
      return;
    }

    setSubmitting(true);
    
    try {
      const fileUrls: string[] = [];

      // Upload all files
      for (const file of files) {
        const path = buildStoragePath(file);
        const fileUrl = await uploadFile(file, path);
        fileUrls.push(fileUrl);
      }

      // Filter out empty links
      const validLinks = links.filter(link => link.trim() !== '');

      // Create submission with all data
      const submissionData: any = {
        student_id: studentId,
        class_id: classId,
        project_id: parseInt(projectId!),
        description: description || null,
      };

      // Add links (up to 3)
      if (validLinks[0]) submissionData.link1 = validLinks[0];
      if (validLinks[1]) submissionData.link2 = validLinks[1];
      if (validLinks[2]) submissionData.link3 = validLinks[2];

      // Add file URLs (up to 3)
      if (fileUrls[0]) submissionData.file1_url = fileUrls[0];
      if (fileUrls[1]) submissionData.file2_url = fileUrls[1];
      if (fileUrls[2]) submissionData.file3_url = fileUrls[2];

      const { error } = await supabase
        .from('submissions')
        .insert(submissionData);

      if (error) throw error;

      toast.success('Soumission envoyée avec succès!');
      navigate('/etudiant/soumissions');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!project) {
    return (
      <StudentDashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Projet non trouvé</p>
        </div>
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/etudiant/projets')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {/* Project Hero Section */}
        <div className="space-y-6">
          {/* Hero Image or Header */}
          {project.image_url ? (
            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              <img
                src={project.image_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 mb-4">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-semibold text-primary">{project.code}</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-3 leading-tight">
                    {project.title}
                  </h1>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 md:p-12">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-semibold text-primary">{project.code}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-3 leading-tight">{project.title}</h1>
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          {project.deadline_at && (
            <DeadlineCountdown deadline={project.deadline_at} />
          )}
        </div>

        {/* Project Description */}
        {project.description && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                Description du projet
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-lg">
                  {project.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Links Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Liens
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLink}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un lien
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="url"
                      value={link}
                      onChange={(e) => updateLink(index, e.target.value)}
                      placeholder="https://..."
                      className="w-full"
                    />
                  </div>
                  {links.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Files Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Fichiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour sélectionner des fichiers
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vous pouvez ajouter plusieurs fichiers
                  </p>
                </Label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fichiers sélectionnés:</Label>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description Section */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajoutez des commentaires ou notes sur votre soumission..."
                rows={6}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={submitting || isDeadlineExpired}
              variant={isDeadlineExpired ? "outline" : "default"}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Envoi en cours...
                </>
              ) : isDeadlineExpired ? (
                <>
                  <X className="h-4 w-4" />
                  Délai expiré - Soumission impossible
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Soumettre le projet
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </StudentDashboardLayout>
  );
}
