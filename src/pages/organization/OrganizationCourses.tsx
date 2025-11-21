import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, BookOpen, FileText, Eye, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CreateCourseDialog } from '@/components/organization/CreateCourseDialog';
import { EditCourseDialog } from '@/components/organization/EditCourseDialog';
import { SubmissionReviewDialog } from '@/components/organization/SubmissionReviewDialog';

interface Course {
  id: string;
  title: string;
  description: string | null;
  code: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  title: string;
  description: string | null;
  status: string;
  student_id: string;
  course_id: string;
  submitted_at: string | null;
  grade: number | null;
  feedback: string | null;
  file_url: string | null;
  submito_organization_students?: {
    full_name: string | null;
    email: string;
  } | null;
  submito_organization_courses?: {
    title: string;
    code: string;
  } | null;
}

export default function OrganizationCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionSearchQuery, setSubmissionSearchQuery] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = useState(false);

  useEffect(() => {
    loadCourses();
    loadSubmissions();
  }, []);

  const loadCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('submito_organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) return;

      setOrganizationId(membership.organization_id);

      const { data, error } = await supabase
        .from('submito_organization_courses')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
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
        .from('submito_organization_submissions')
        .select(`
          *,
          submito_organization_students(full_name, email),
          submito_organization_courses(title, code)
        `)
        .eq('organization_id', membership.organization_id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubmissions = submissions.filter(submission => {
    const studentName = submission.submito_organization_students?.full_name || '';
    const courseTitle = submission.submito_organization_courses?.title || '';
    const searchLower = submissionSearchQuery.toLowerCase();
    
    return (
      submission.title.toLowerCase().includes(searchLower) ||
      studentName.toLowerCase().includes(searchLower) ||
      courseTitle.toLowerCase().includes(searchLower) ||
      submission.status.toLowerCase().includes(searchLower)
    );
  });

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setIsEditCourseDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Activities</h1>
            <p className="text-muted-foreground mt-1">Manage your organization's courses and submissions</p>
          </div>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="bg-card/40 backdrop-blur-xl border-border/50">
            <TabsTrigger value="courses" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Submissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/40 backdrop-blur-xl border-border/50"
                />
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </div>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
              <CardContent className="pt-6">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No courses found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                      <Card
                        key={course.id}
                        className="bg-background/30 border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
                        onClick={() => handleCourseClick(course)}
                      >
                        <CardHeader className="pb-3">
                          {course.image_url ? (
                            <div className="w-full h-40 mb-3 rounded-lg overflow-hidden">
                              <img 
                                src={course.image_url} 
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-40 mb-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                              <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                {course.title}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground font-mono mt-1">{course.code}</p>
                            </div>
                            <Badge variant={course.is_active ? "default" : "secondary"}>
                              {course.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {course.description || 'No description available'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search submissions..."
                value={submissionSearchQuery}
                onChange={(e) => setSubmissionSearchQuery(e.target.value)}
                className="pl-10 bg-card/40 backdrop-blur-xl border-border/50"
              />
            </div>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
              <CardContent className="pt-6">
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No submissions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSubmissions.map((submission) => (
                      <Card
                        key={submission.id}
                        className="bg-background/30 border-border/50 hover:border-primary/50 transition-all"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{submission.title}</CardTitle>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>{submission.submito_organization_students?.full_name || 'Unknown Student'}</span>
                                <span>•</span>
                                <span>{submission.submito_organization_courses?.title || 'Unknown Course'}</span>
                                {submission.submitted_at && (
                                  <>
                                    <span>•</span>
                                    <span>{new Date(submission.submitted_at).toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                submission.status === 'approved' ? 'default' :
                                submission.status === 'rejected' ? 'destructive' :
                                'secondary'
                              }>
                                {submission.status}
                              </Badge>
                              {submission.grade !== null && (
                                <Badge variant="outline">{submission.grade}%</Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setIsReviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {submission.description && (
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {submission.description}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateCourseDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          organizationId={organizationId || ''}
          onCourseCreated={loadCourses}
        />

        {selectedCourse && (
          <EditCourseDialog
            open={isEditCourseDialogOpen}
            onOpenChange={setIsEditCourseDialogOpen}
            courseData={selectedCourse}
            onCourseUpdated={loadCourses}
          />
        )}

        <SubmissionReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          submission={selectedSubmission}
          onReviewCompleted={() => {
            loadSubmissions();
            setIsReviewDialogOpen(false);
          }}
        />
      </div>
    </div>
  );
}
