import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Calendar, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RichTextRenderer } from '@/components/ui/rich-text-editor';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RefreshHeader } from '@/components/admin/RefreshHeader';

interface Project {
  id: number;
  title: string;
  description?: string;
  deadline_at: string;
  is_active: boolean;
  created_at: string;
  image_url?: string;
  classes: { id: number; code: string; title: string }[];
  submissions_count: number;
}

export default function AcademyProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  const loadData = async () => {
    try {
      const projectsResponse = await supabase
        .from('projects')
        .select(`
          id, title, description, deadline_at, is_active, created_at, image_url,
          class_projects!inner(classes!inner(id, code, title))
        `)
        .order('created_at', { ascending: false });

      if (projectsResponse.data) {
        const projectIds = projectsResponse.data.map(p => p.id);
        const submissionsResponse = await supabase
          .from('submissions')
          .select('project_id')
          .in('project_id', projectIds);

        const submissionCounts = submissionsResponse.data?.reduce((acc, sub) => {
          acc[sub.project_id] = (acc[sub.project_id] || 0) + 1;
          return acc;
        }, {} as Record<number, number>) || {};

        const transformedProjects = projectsResponse.data.map((item: any) => {
          const classesArray = Array.isArray(item.class_projects)
            ? item.class_projects.map((cp: any) => cp.classes).filter(Boolean)
            : item.class_projects?.classes ? [item.class_projects.classes] : [];

          return {
            id: item.id,
            title: item.title,
            description: item.description,
            deadline_at: item.deadline_at,
            is_active: item.is_active,
            created_at: item.created_at,
            image_url: item.image_url,
            classes: classesArray,
            submissions_count: submissionCounts[item.id] || 0,
          };
        });

        setProjects(transformedProjects);
      }
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const isExpired = (deadline: string) => new Date(deadline) < new Date();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <RefreshHeader lastRefreshTime={lastRefreshTime} onRefresh={loadData} />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Projets</h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble des projets par classe — {projects.length} projet{projects.length > 1 ? 's' : ''}
        </p>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Aucun projet disponible</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden hover:shadow-md transition-all">
              {project.image_url && (
                <div className="h-32 bg-muted">
                  <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground line-clamp-2">{project.title}</h3>
                  <Badge variant={project.is_active ? 'default' : 'secondary'}>
                    {project.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  {project.classes.map((cls) => (
                    <Badge key={cls.id} variant="outline" className="text-xs">{cls.code}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {isExpired(project.deadline_at) ? (
                      <span className="text-destructive">Expiré</span>
                    ) : (
                      formatDistanceToNow(new Date(project.deadline_at), { addSuffix: true, locale: fr })
                    )}
                  </span>
                  <span>{project.submissions_count} soumission{project.submissions_count > 1 ? 's' : ''}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setSelectedProject(project)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Voir les détails
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal (read-only) */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              {selectedProject.image_url && (
                <img src={selectedProject.image_url} alt={selectedProject.title} className="w-full rounded-lg" />
              )}
              <div className="flex flex-wrap gap-2">
                {selectedProject.classes.map((cls) => (
                  <Badge key={cls.id} variant="secondary">{cls.code} — {cls.title}</Badge>
                ))}
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Date limite :</strong> {new Date(selectedProject.deadline_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Soumissions :</strong> {selectedProject.submissions_count}</p>
                <p><strong>Statut :</strong> {selectedProject.is_active ? 'Actif' : 'Inactif'}</p>
              </div>
              {selectedProject.description && (
                <div className="p-3 bg-muted/50 rounded-lg border text-sm">
                  <RichTextRenderer content={selectedProject.description} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
