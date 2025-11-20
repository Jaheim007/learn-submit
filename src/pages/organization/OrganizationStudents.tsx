import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, Mail, Phone, Shield, GraduationCap } from 'lucide-react';
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

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_owner: boolean;
  created_at: string;
}

export default function OrganizationStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [teachers, setTeachers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('submito_organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) return;

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('submito_organization_students')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Load staff members and teachers
      const { data: membersData, error: membersError } = await supabase
        .from('submito_organization_users')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;
      
      // Separate staff and teachers based on role
      const staff = membersData?.filter(m => m.role !== 'teacher') || [];
      const teachersList = membersData?.filter(m => m.role === 'teacher') || [];
      
      setStaffMembers(staff);
      setTeachers(teachersList);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStaff = staffMembers.filter(member =>
    member.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    member.full_name?.toLowerCase().includes(staffSearchQuery.toLowerCase())
  );

  const filteredTeachers = teachers.filter(teacher =>
    teacher.email.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
    teacher.full_name?.toLowerCase().includes(teacherSearchQuery.toLowerCase())
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">People Management</h1>
          <p className="text-muted-foreground mt-1">Manage students, staff members, and teachers</p>
        </div>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="bg-background/50 border border-border/50">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="staff">Staff Members</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-xl font-semibold text-foreground">Students</CardTitle>
                <Button className="bg-primary hover:bg-primary/90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
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
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {student.full_name?.charAt(0) || student.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {student.full_name || 'No name'}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
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
                      <Badge className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-xl font-semibold text-foreground">Staff Members</CardTitle>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff members..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No staff members found
                  </div>
                ) : (
                  filteredStaff.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {member.full_name || 'No name'}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          {member.role}
                        </Badge>
                        {member.is_owner && (
                          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                            Owner
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-xl font-semibold text-foreground">Teachers</CardTitle>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTeachers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No teachers found
                  </div>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {teacher.full_name || 'No name'}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {teacher.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        Teacher
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
