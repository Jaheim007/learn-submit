import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, GraduationCap } from 'lucide-react';

interface Class {
  id: number;
  code: string;
  title: string;
  session_name?: string;
  is_active: boolean;
  is_open_for_signup: boolean;
  signup_deadline?: string;
}

export default function AdminClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, code, title, session_name, is_active, is_open_for_signup, signup_deadline')
        .order('session_name', { ascending: true })
        .order('code', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les classes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSignupStatus = async (classId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ is_open_for_signup: !currentStatus })
        .eq('id', classId);

      if (error) throw error;

      setClasses(prev => prev.map(cls => 
        cls.id === classId 
          ? { ...cls, is_open_for_signup: !currentStatus }
          : cls
      ));

      toast({
        title: "Statut mis à jour",
        description: `Les inscriptions ont été ${!currentStatus ? 'ouvertes' : 'fermées'} pour cette classe`,
      });
    } catch (error) {
      console.error('Error updating signup status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut des inscriptions",
        variant: "destructive"
      });
    }
  };

  const getSessionBadgeVariant = (sessionName?: string) => {
    if (!sessionName) return 'secondary';
    if (sessionName.includes('1ère')) return 'outline';
    if (sessionName.includes('2ème')) return 'default';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Group classes by session
  const sessionGroups = classes.reduce((groups, cls) => {
    const session = cls.session_name || 'Sans session';
    if (!groups[session]) {
      groups[session] = [];
    }
    groups[session].push(cls);
    return groups;
  }, {} as Record<string, Class[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Classes</h1>
        <p className="text-muted-foreground">
          Contrôlez l'ouverture et la fermeture des inscriptions par classe
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(sessionGroups).map(([sessionName, sessionClasses]) => (
          <Card key={sessionName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {sessionName}
              </CardTitle>
              <CardDescription>
                {sessionClasses.length} classe{sessionClasses.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscriptions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionClasses.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.code}</TableCell>
                      <TableCell>{cls.title}</TableCell>
                      <TableCell>
                        <Badge variant={cls.is_active ? 'default' : 'secondary'}>
                          {cls.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cls.is_open_for_signup ? 'default' : 'outline'}>
                          {cls.is_open_for_signup ? 'Ouvertes' : 'Fermées'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={cls.is_open_for_signup}
                            onCheckedChange={() => toggleSignupStatus(cls.id, cls.is_open_for_signup)}
                            disabled={!cls.is_active}
                          />
                          <span className="text-sm text-muted-foreground">
                            {cls.is_open_for_signup ? 'Fermer' : 'Ouvrir'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}