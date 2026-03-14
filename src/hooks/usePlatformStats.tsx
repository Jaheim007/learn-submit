import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlatformStats {
  submissionsCount: string;
  studentsCount: string;
  validationRate: string;
  coursesCount: string;
}

async function fetchPlatformStats(): Promise<PlatformStats> {
  const [submissionsRes, studentsRes, approvedRes, coursesRes] = await Promise.all([
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'approved').eq('is_latest', true),
    supabase.from('course_materials').select('id', { count: 'exact', head: true }),
  ]);

  const totalSubs = submissionsRes.count ?? 0;
  const totalStudents = studentsRes.count ?? 0;

  // Compute validation rate from latest submissions only
  const approvedCount = approvedRes.count ?? 0;
  // We need total latest submissions for the rate
  const { count: latestCount } = await supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('is_latest', true);
  const rate = (latestCount && latestCount > 0) ? Math.round((approvedCount / latestCount) * 100) : 0;

  const coursesCount = coursesRes.count ?? 0;

  const formatCount = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
    return `${n}+`;
  };

  return {
    submissionsCount: formatCount(totalSubs),
    studentsCount: formatCount(totalStudents),
    validationRate: `${rate}%`,
    coursesCount: formatCount(coursesCount),
  };
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: fetchPlatformStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    // Provide defaults so UI never shows blanks
    placeholderData: {
      submissionsCount: '...',
      studentsCount: '...',
      validationRate: '...',
      coursesCount: '...',
    },
  });
}
