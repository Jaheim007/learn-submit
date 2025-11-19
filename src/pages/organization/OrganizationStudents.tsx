import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  status: string;
  enrolled_at: string | null;
  created_at: string;
}


export default function OrganizationStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('submito_organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) return;

      const { data, error } = await supabase
        .from('submito_organization_students')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'p-8' : 'min-h-screen'}`}>
        <div className="animate-pulse text-muted-foreground">Loading students...</div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'p-6' : 'min-h-screen bg-background p-8'}>
      <div className="max-w-7xl mx-auto space-y-6">
        {!embedded && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Students</h1>
              <p className="text-muted-foreground mt-1">Manage your organization's students</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        )}

        <Card className="bg-card/40 backdrop-blur-xl border-border/50">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No students found
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/30 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-lg">
                          {student.full_name?.charAt(0).toUpperCase() || student.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {student.full_name || 'Unnamed Student'}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </span>
                          {student.phone && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {student.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
    </Card>
  );
}
