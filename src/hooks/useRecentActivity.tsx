import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivity {
  id: string;
  type: 'student' | 'submission' | 'course';
  message: string;
  timestamp: string;
  timeAgo: string;
}

export const useRecentActivity = (organizationId: string | null) => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const loadRecentActivity = async () => {
      try {
        const activities: RecentActivity[] = [];

        // Get recent students (last 7 days)
        const { data: students } = await supabase
          .from('submito_organization_students')
          .select('created_at, full_name')
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        students?.forEach(student => {
          activities.push({
            id: `student-${student.created_at}`,
            type: 'student',
            message: `${student.full_name || 'New student'} enrolled`,
            timestamp: student.created_at,
            timeAgo: formatDistanceToNow(new Date(student.created_at), { addSuffix: true })
          });
        });

        // Get recent submissions (last 7 days)
        const { data: submissions } = await supabase
          .from('submito_organization_submissions')
          .select('created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        const submissionCount = submissions?.length || 0;
        if (submissionCount > 0 && submissions) {
          activities.push({
            id: `submissions-${submissions[0].created_at}`,
            type: 'submission',
            message: `${submissionCount} submission${submissionCount > 1 ? 's' : ''} received`,
            timestamp: submissions[0].created_at,
            timeAgo: formatDistanceToNow(new Date(submissions[0].created_at), { addSuffix: true })
          });
        }

        // Get recent courses (last 7 days)
        const { data: courses } = await supabase
          .from('submito_organization_courses')
          .select('created_at, title')
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        courses?.forEach(course => {
          activities.push({
            id: `course-${course.created_at}`,
            type: 'course',
            message: `Course "${course.title}" published`,
            timestamp: course.created_at,
            timeAgo: formatDistanceToNow(new Date(course.created_at), { addSuffix: true })
          });
        });

        // Sort all activities by timestamp
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setActivities(activities.slice(0, 5));
      } catch (error) {
        console.error('Error loading recent activity:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentActivity();
  }, [organizationId]);

  return { activities, loading };
};
