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
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';

interface Project {
  id: number;
  code: string;
  title: string;
  description: string;
  due_at: string | null;
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
  
  const [link1, setLink1] = useState('');
  const [link2, setLink2] = useState('');
  const [link3, setLink3] = useState('');
  const [description, setDescription] = useState('');
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [file3, setFile3] = useState<File | null>(null);

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

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('submissions')
      .upload(path, file);

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId || !classId) {
      toast.error('Données manquantes');
      return;
    }

    setSubmitting(true);
    
    try {
      let file1Url = null, file2Url = null, file3Url = null;

      // Upload files if present
      if (file1) {
        const path = `${studentId}/${projectId}/${file1.name}`;
        file1Url = await uploadFile(file1, path);
      }
      if (file2) {
        const path = `${studentId}/${projectId}/${file2.name}`;
        file2Url = await uploadFile(file2, path);
      }
      if (file3) {
        const path = `${studentId}/${projectId}/${file3.name}`;
        file3Url = await uploadFile(file3, path);
      }

      // Create submission
      const { error } = await supabase
        .from('submissions')
        .insert({
          student_id: studentId,
          class_id: classId,
          project_id: parseInt(projectId!),
          link1: link1 || null,
          link2: link2 || null,
          link3: link3 || null,
          file1_url: file1Url,
          file2_url: file2Url,
          file3_url: file3Url,
          description: description || null,
          status: 'Reçu'
        });

      if (error) throw error;

      toast.success('Projet soumis avec succès !');
      navigate('/etudiant/projets');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (!project) return null;

  return (
    <StudentDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/etudiant/projets')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-2">Soumettre un Projet</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{project.code}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground font-medium">{project.title}</span>
          </div>
        </div>

        {project.description && (
          <div className="premium-card p-4">
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="premium-card p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Liens (optionnels)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="link1">Lien 1</Label>
              <Input
                id="link1"
                type="url"
                value={link1}
                onChange={(e) => setLink1(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link2">Lien 2</Label>
              <Input
                id="link2"
                type="url"
                value={link2}
                onChange={(e) => setLink2(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link3">Lien 3</Label>
              <Input
                id="link3"
                type="url"
                value={link3}
                onChange={(e) => setLink3(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fichiers (optionnels)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="file1">Fichier 1</Label>
              <Input
                id="file1"
                type="file"
                onChange={(e) => setFile1(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file2">Fichier 2</Label>
              <Input
                id="file2"
                type="file"
                onChange={(e) => setFile2(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file3">Fichier 3</Label>
              <Input
                id="file3"
                type="file"
                onChange={(e) => setFile3(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre projet..."
              rows={5}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Soumission en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Soumettre le projet
              </>
            )}
          </Button>
        </form>
      </div>
    </StudentDashboardLayout>
  );
}
