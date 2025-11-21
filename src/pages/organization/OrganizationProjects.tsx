import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CreateProjectDialog from "@/components/organization/CreateProjectDialog";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  code: string;
  title: string;
  description: string | null;
  image_url: string | null;
  deadline_at: string | null;
  is_active: boolean;
  created_at: string;
  classes: Array<{ id: string; name: string }>;
  resources_count: number;
}

interface Class {
  id: string;
  name: string;
}

export default function OrganizationProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization
      const { data: orgUser } = await supabase
        .from('submito_organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!orgUser) return;
      setOrganizationId(orgUser.organization_id);

      // Load classes
      const { data: classesData } = await supabase
        .from('submito_organization_classes')
        .select('id, name')
        .eq('organization_id', orgUser.organization_id)
        .eq('is_active', true)
        .order('name');

      setClasses(classesData || []);

      // Load projects
      const { data: projectsData, error } = await supabase
        .from('submito_organization_projects')
        .select(`
          *,
          submito_project_class_assignments(
            class_id,
            submito_organization_classes(id, name)
          ),
          submito_project_resources(id)
        `)
        .eq('organization_id', orgUser.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects = projectsData?.map((project: any) => ({
        id: project.id,
        code: project.code,
        title: project.title,
        description: project.description,
        image_url: project.image_url,
        deadline_at: project.deadline_at,
        is_active: project.is_active,
        created_at: project.created_at,
        classes: project.submito_project_class_assignments?.map((a: any) => ({
          id: a.submito_organization_classes.id,
          name: a.submito_organization_classes.name,
        })) || [],
        resources_count: project.submito_project_resources?.length || 0,
      })) || [];

      setProjects(formattedProjects);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const toggleProjectStatus = async (projectId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('submito_organization_projects')
        .update({ is_active: !currentStatus })
        .eq('id', projectId);

      if (error) throw error;

      toast.success(`Project ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadData();
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Create and manage projects for your organization
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No projects yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first project to get started
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              {project.image_url && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{project.title}</CardTitle>
                    <CardDescription className="text-xs font-mono">
                      {project.code}
                    </CardDescription>
                  </div>
                  <Badge variant={project.is_active ? "default" : "secondary"}>
                    {project.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {project.deadline_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Due {formatDistanceToNow(new Date(project.deadline_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{project.classes.length} class(es)</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>{project.resources_count} resource(s)</span>
                  </div>
                </div>

                {project.classes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.classes.map((cls) => (
                      <Badge key={cls.id} variant="outline" className="text-xs">
                        {cls.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toggleProjectStatus(project.id, project.is_active)}
                >
                  {project.is_active ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        organizationId={organizationId}
        classes={classes}
        onProjectCreated={loadData}
      />
    </div>
  );
}
