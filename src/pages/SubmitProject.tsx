import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Loader2, 
  X, 
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

interface ProjectInfo {
  id: number;
  code: string;
  title: string;
  description: string;
}

interface ClassInfo {
  id: number;
  code: string;
  title: string;
}

interface FileUpload {
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  url: string;
}

export default function SubmitProject() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [studentId, setStudentId] = useState<string>('');
  
  // Form data
  const [links, setLinks] = useState(['', '', '']);
  const [files, setFiles] = useState<FileUpload[]>([
    { file: null, uploading: false, uploaded: false, url: '' },
    { file: null, uploading: false, uploaded: false, url: '' },
    { file: null, uploading: false, uploaded: false, url: '' }
  ]);
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const projectId = searchParams.get('project_id');
  const classId = searchParams.get('class_id');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user && projectId && classId) {
      validateAndLoadData();
    } else if (!projectId || !classId) {
      toast({
        title: "Paramètres manquants",
        description: "Projet ou classe non spécifié",
        variant: "destructive"
      });
      navigate('/etudiant/mes-projets');
    }
  }, [user, authLoading, projectId, classId, navigate]);

  const validateAndLoadData = async () => {
    try {
      setLoading(true);

      // Get student ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (studentError || !studentData) {
        throw new Error('Student profile not found');
      }

      setStudentId(studentData.id);

      // Verify student is enrolled in the class
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentData.id)
        .eq('class_id', parseInt(classId!))
        .single();

      if (enrollmentError || !enrollment) {
        throw new Error('Not enrolled in this class');
      }

      // Get project info
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, code, title, description')
        .eq('id', parseInt(projectId!))
        .single();

      if (projectError || !projectData) {
        throw new Error('Project not found');
      }

      setProject(projectData);

      // Get class info
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, code, title')
        .eq('id', parseInt(classId!))
        .single();

      if (classError || !classData) {
        throw new Error('Class not found');
      }

      setClassInfo(classData);

      // Verify project is assigned to class
      const { data: assignment, error: assignmentError } = await supabase
        .from('class_projects')
        .select('id')
        .eq('class_id', parseInt(classId!))
        .eq('project_id', parseInt(projectId!))
        .single();

      if (assignmentError || !assignment) {
        throw new Error('Project not assigned to this class');
      }

    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: "Erreur d'accès",
        description: error.message || "Impossible d'accéder à cette soumission",
        variant: "destructive"
      });
      navigate('/etudiant/mes-projets');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (index: number, file: File) => {
    // Validate file
    const maxSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'];
    
    if (file.size > maxSize) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale autorisée est de 25 MB",
        variant: "destructive"
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Type de fichier non autorisé",
        description: "Formats acceptés : PDF, DOCX, ZIP",
        variant: "destructive"
      });
      return;
    }

    // Start upload
    const newFiles = [...files];
    newFiles[index] = { file, uploading: true, uploaded: false, url: '' };
    setFiles(newFiles);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `${user?.id}/${classInfo?.code}/${project?.code}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the uploaded file URL (this will be a storage path, not a public URL)
      newFiles[index] = { 
        file, 
        uploading: false, 
        uploaded: true, 
        url: filePath 
      };
      setFiles(newFiles);

      toast({
        title: "Fichier uploadé",
        description: `${file.name} a été uploadé avec succès`
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      newFiles[index] = { file: null, uploading: false, uploaded: false, url: '' };
      setFiles(newFiles);
      
      toast({
        title: "Erreur d'upload",
        description: error.message || "Impossible d'uploader le fichier",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFile = async (index: number) => {
    const fileUpload = files[index];
    
    if (fileUpload.url) {
      // Remove from storage
      try {
        await supabase.storage
          .from('submissions')
          .remove([fileUpload.url]);
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }

    const newFiles = [...files];
    newFiles[index] = { file: null, uploading: false, uploaded: false, url: '' };
    setFiles(newFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project || !classInfo || !studentId) return;

    // Validate at least one submission item
    const hasFiles = files.some(f => f.uploaded && f.url);
    const hasLinks = links.some(link => link.trim());
    
    if (!hasFiles && !hasLinks) {
      toast({
        title: "Soumission requise",
        description: "Veuillez ajouter au moins un fichier ou un lien avant de soumettre",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const submissionData = {
        student_id: studentId,
        class_id: parseInt(classId!),
        project_id: parseInt(projectId!),
        link1: links[0] || null,
        link2: links[1] || null,
        link3: links[2] || null,
        file1_url: files[0].url || null,
        file2_url: files[1].url || null,
        file3_url: files[2].url || null,
        description: description || null,
        status: 'Reçu' as const
      };

      const { error } = await supabase
        .from('submissions')
        .insert(submissionData);

      if (error) throw error;

      toast({
        title: "Soumission envoyée !",
        description: "Votre projet a été soumis avec succès"
      });

      // Redirect back to projects with class filter
      navigate(`/etudiant/mes-projets?class=${classId}`);

    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Erreur de soumission",
        description: error.message || "Impossible de soumettre le projet",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-gradient-card py-12 px-4 border-b border-border">
          <div className="max-w-content mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate(`/etudiant/mes-projets?class=${classId}`)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux projets
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Soumettre : {project?.title}
                </h1>
                <p className="text-muted-foreground">
                  {classInfo?.code} - {classInfo?.title}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-content mx-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Project Info */}
            {project?.description && (
              <Card className="mb-8 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <h3 className="font-medium text-foreground mb-2">
                    Description du projet
                  </h3>
                  <p className="text-muted-foreground">
                    {project.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Submission Form */}
            <Card className="card-educational">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Formulaire de soumission
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tous les champs sont optionnels. Ajoutez les éléments disponibles pour votre projet.
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Links Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      Liens du projet
                    </h3>
                    
                    {links.map((link, index) => (
                      <div key={index} className="space-y-2">
                        <Label htmlFor={`link${index + 1}`}>
                          Lien {index + 1}
                        </Label>
                        <Input
                          id={`link${index + 1}`}
                          type="url"
                          value={link}
                          onChange={(e) => {
                            const newLinks = [...links];
                            newLinks[index] = e.target.value;
                            setLinks(newLinks);
                          }}
                          placeholder={`https://exemple.com/projet-${index + 1}`}
                          className="input-educational"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Files Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Fichiers du projet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Formats acceptés : PDF, DOCX, ZIP • Taille max : 25 MB
                    </p>
                    
                    {files.map((fileUpload, index) => (
                      <div key={index} className="space-y-2">
                        <Label>Fichier {index + 1}</Label>
                        
                        {!fileUpload.file ? (
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <input
                              type="file"
                              accept=".pdf,.docx,.zip"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileSelect(index, file);
                                }
                              }}
                              className="hidden"
                              id={`file-${index}`}
                            />
                            <label
                              htmlFor={`file-${index}`}
                              className="cursor-pointer flex flex-col items-center gap-2"
                            >
                              <Upload className="w-8 h-8 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Cliquez pour sélectionner un fichier
                              </span>
                            </label>
                          </div>
                        ) : (
                          <div className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {fileUpload.uploading ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                ) : fileUpload.uploaded ? (
                                  <CheckCircle className="w-5 h-5 text-success" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-warning" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {fileUpload.file.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(fileUpload.file.size / (1024 * 1024)).toFixed(1)} MB
                                  </p>
                                </div>
                              </div>
                              
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(index)}
                                disabled={fileUpload.uploading}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Description & détails
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Description du projet
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez votre projet, les technologies utilisées, les défis rencontrés..."
                        className="min-h-[120px] input-educational"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6 border-t border-border">
                    <Button 
                      type="submit" 
                      disabled={submitting || files.some(f => f.uploading)}
                      className="btn-primary"
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Upload className="mr-2 h-4 w-4" />
                      Soumettre le projet
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}