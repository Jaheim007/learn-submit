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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeadlineCountdown } from '@/components/DeadlineCountdown';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Plus, X, Link as LinkIcon, FileText } from 'lucide-react';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';

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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingFile, setUploadingFile] = useState<string>('');

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

      // Find the correct class_id: check which enrolled class has this project
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', studentData.id);

      const enrolledClassIds = (enrollments || []).map((e: any) => e.class_id);
      
      if (enrolledClassIds.length > 0) {
        const { data: classProject } = await supabase
          .from('class_projects')
          .select('class_id')
          .eq('project_id', parseInt(projectId!))
          .in('class_id', enrolledClassIds)
          .limit(1)
          .maybeSingle();
        
        setClassId(classProject?.class_id || studentData.primary_class_id);
      } else {
        setClassId(studentData.primary_class_id);
      }

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

  // 100 MB max per file
  const MAX_FILE_SIZE_MB = 100;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  // Allowed file extensions
  const ALLOWED_EXTENSIONS = new Set([
    // Documents
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp', 'txt', 'rtf', 'csv',
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
    // Archives
    'zip', 'rar', '7z', 'tar', 'gz',
    // Code / Dev
    'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'yaml', 'yml', 'md', 'py', 'java', 'c', 'cpp', 'h', 'sql',
    // Design
    'fig', 'sketch', 'xd', 'psd', 'ai',
    // Video / Audio
    'mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'm4a',
  ]);

  const getFileExtension = (filename: string): string => {
    const dot = filename.lastIndexOf('.');
    return dot > -1 ? filename.slice(dot + 1).toLowerCase() : '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Check file types
    const invalidType = selectedFiles.filter(f => !ALLOWED_EXTENSIONS.has(getFileExtension(f.name)));
    if (invalidType.length > 0) {
      toast.error(
        `Type de fichier non autorisé : ${invalidType.map(f => f.name).join(', ')}. Formats acceptés : documents, images, archives, code, média.`
      );
      const validTypeFiles = selectedFiles.filter(f => ALLOWED_EXTENSIONS.has(getFileExtension(f.name)));
      if (validTypeFiles.length === 0) return;
      // Continue with valid-type files only
      const oversized = validTypeFiles.filter(f => f.size > MAX_FILE_SIZE_BYTES);
      if (oversized.length > 0) {
        toast.error(`Fichier(s) trop volumineux : ${oversized.map(f => f.name).join(', ')}. Taille max : ${MAX_FILE_SIZE_MB} MB.`);
      }
      const validFiles = validTypeFiles.filter(f => f.size <= MAX_FILE_SIZE_BYTES);
      if (validFiles.length > 0) setFiles([...files, ...validFiles]);
      return;
    }

    // Check file sizes
    const oversized = selectedFiles.filter(f => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      toast.error(
        `Fichier(s) trop volumineux : ${oversized.map(f => f.name).join(', ')}. Taille max : ${MAX_FILE_SIZE_MB} MB.`
      );
      const validFiles = selectedFiles.filter(f => f.size <= MAX_FILE_SIZE_BYTES);
      if (validFiles.length > 0) setFiles([...files, ...validFiles]);
      return;
    }
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
    setUploadingFile(file.name);
    try {
      const { data, error } = await supabase.storage
        .from('submissions')
        .upload(path, file, {
          upsert: false,
          duplex: 'half',
        });

      if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (msg.includes('invalid key')) {
          throw new Error('Nom de fichier non valide. Renommez-le sans accents, apostrophes ou caractères spéciaux (ex: capture_2025.png).');
        }
        if (msg.includes('payload too large') || msg.includes('file size') || msg.includes('too large')) {
          throw new Error(`Fichier trop volumineux : ${file.name}. Taille max : ${MAX_FILE_SIZE_MB} MB.`);
        }
        if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
          throw new Error(`Erreur réseau lors de l'upload de "${file.name}". Vérifiez votre connexion internet et réessayez. Si le fichier est très volumineux (>${MAX_FILE_SIZE_MB}MB), réduisez sa taille.`);
        }
        throw error;
      }
      return data.path;
    } finally {
      setUploadingFile('');
    }
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

      // Upload all files (no limit)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadingFile(`${file.name} (${i + 1}/${files.length})`);
        const path = buildStoragePath(file);
        const fileUrl = await uploadFile(file, path);
        fileUrls.push(fileUrl);
      }

      // Filter out empty links
      const validLinks = links.filter(link => link.trim() !== '');

      // Mark any previous submission for this project as not latest
      await supabase
        .from('submissions')
        .update({ is_latest: false })
        .eq('student_id', studentId)
        .eq('project_id', parseInt(projectId!))
        .eq('is_latest', true);

      // Create submission with all data
      const submissionData: any = {
        student_id: studentId,
        class_id: classId,
        project_id: parseInt(projectId!),
        description: description || null,
        // Store all file URLs in the new unlimited array column
        file_urls: fileUrls.length > 0 ? fileUrls : [],
      };

      // Also populate legacy columns (up to 3) for backward compatibility
      if (validLinks[0]) submissionData.link1 = validLinks[0];
      if (validLinks[1]) submissionData.link2 = validLinks[1];
      if (validLinks[2]) submissionData.link3 = validLinks[2];

      // Legacy file columns (for backward compat)
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
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Back Button — native style */}
        <button
          onClick={() => navigate('/etudiant/projets')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        {/* Project Hero — compact on mobile */}
        <div className="space-y-3">
          {project.image_url ? (
            <div className="relative w-full h-40 lg:h-[300px] rounded-2xl overflow-hidden border border-border/50">
              <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Badge variant="outline" className="bg-card/90 backdrop-blur-sm border-border/30 text-[11px] font-bold rounded-lg mb-2">{project.code}</Badge>
                <h1 className="text-lg lg:text-2xl font-bold text-foreground leading-tight">{project.title}</h1>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/8 via-card to-accent/5 p-4 lg:p-6">
              <Badge variant="outline" className="bg-card/90 backdrop-blur-sm border-border/30 text-[11px] font-bold rounded-lg mb-2">{project.code}</Badge>
              <h1 className="text-lg lg:text-2xl font-bold leading-tight">{project.title}</h1>
            </div>
          )}

          {/* Countdown Timer */}
          {project.deadline_at && (
            <DeadlineCountdown deadline={project.deadline_at} />
          )}
        </div>

        {/* Project Description — collapsible on mobile */}
        {project.description && (
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Description
            </h3>
            <div className="prose dark:prose-invert max-w-none text-sm">
              <RichTextRenderer content={project.description} className="text-muted-foreground leading-relaxed" />
            </div>
          </div>
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
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.ods,.odp,.txt,.rtf,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip,.rar,.7z,.html,.css,.js,.ts,.json,.xml,.md,.py,.java,.mp4,.mov,.mp3,.wav"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour sélectionner des fichiers (nombre illimité)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Taille max par fichier : {MAX_FILE_SIZE_MB} MB (ZIP, RAR, PDF, MP4, etc.)
                  </p>
                </Label>
              </div>

              {/* Upload progress indicator */}
              {uploadingFile && (
                <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <span className="animate-spin text-primary">⏳</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary">Upload en cours...</p>
                    <p className="text-xs text-muted-foreground truncate">{uploadingFile}</p>
                  </div>
                </div>
              )}

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fichiers sélectionnés:</Label>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={submitting}
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
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Ajoutez des commentaires ou notes sur votre soumission..."
                minHeight="140px"
              />
            </CardContent>
          </Card>

          {/* Submit Button — full width, sticky feel on mobile */}
          <Button
            type="submit"
            disabled={submitting || !!isDeadlineExpired}
            variant={isDeadlineExpired ? "outline" : "default"}
            className="w-full h-12 rounded-2xl font-semibold text-base shadow-lg shadow-primary/20 native-btn gap-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin">⏳</span>
                {uploadingFile ? `Upload: ${uploadingFile.slice(0, 20)}...` : 'Envoi en cours...'}
              </>
            ) : isDeadlineExpired ? (
              <>
                <X className="h-4 w-4" />
                Délai expiré
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Soumettre le projet
              </>
            )}
          </Button>
        </form>
      </div>
    </StudentDashboardLayout>
  );
}
