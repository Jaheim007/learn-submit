import { supabase } from '@/integrations/supabase/client';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  hasClasses: boolean;
  hasProjects: boolean;
}

export const TEST_USERS: TestUser[] = [
  {
    email: 'prof.avec.projets@test.com',
    password: 'TestPassword123!',
    name: 'Professeur Avec Projets',
    hasClasses: true,
    hasProjects: true
  },
  {
    email: 'etudiant.sans.projet@test.com', 
    password: 'TestPassword123!',
    name: 'Étudiant Sans Projet',
    hasClasses: false,
    hasProjects: false
  }
];

/**
 * Creates test enrollments for a student
 */
export async function createTestEnrollments(studentId: string, classIds: number[] = [1, 2]) {
  const enrollments = classIds.map(classId => ({
    student_id: studentId,
    class_id: classId
  }));

  const { data, error } = await supabase
    .from('enrollments')
    .insert(enrollments)
    .select();

  if (error) {
    console.error('Error creating test enrollments:', error);
    throw error;
  }

  return data;
}

/**
 * Creates test submissions for a student
 */
export async function createTestSubmissions(studentId: string, projectIds: number[] = [1], classId: number = 1) {
  const submissions = projectIds.map((projectId, index) => ({
    student_id: studentId,
    project_id: projectId,
    class_id: classId,
    status: ['Reçu', 'En révision', 'Validé', 'Refusé'][index % 4] as any,
    description: `Test submission for project ${projectId} - comprehensive testing description with details about the implementation`,
    link1: `https://github.com/test/project-${projectId}`,
    link2: `https://test-app-${projectId}.netlify.app`,
    link3: index > 0 ? `https://docs-project-${projectId}.com` : null
  }));

  const { data, error } = await supabase
    .from('submissions')
    .insert(submissions)
    .select();

  if (error) {
    console.error('Error creating test submissions:', error);
    throw error;
  }

  return data;
}

/**
 * Test API endpoint for student projects
 */
export async function testStudentProjectsAPI(userId: string) {
  console.log('🧪 Testing Student Projects API for user:', userId);

  try {
    // Test 1: Get student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (studentError) {
      return { success: false, error: `Student fetch error: ${studentError.message}` };
    }

    if (!student) {
      return { success: true, data: { classes: [], projects: [], message: 'No student profile' } };
    }

    // Test 2: Get enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        class_id,
        classes!inner (
          id,
          code,
          title
        )
      `)
      .eq('student_id', student.id);

    if (enrollmentsError) {
      return { success: false, error: `Enrollments fetch error: ${enrollmentsError.message}` };
    }

    const classes = enrollments?.map(e => e.classes) || [];

    if (classes.length === 0) {
      return { success: true, data: { classes: [], projects: [], message: 'No classes enrolled' } };
    }

    // Test 3: Get projects
    const classIds = classes.map(c => c.id);
    const { data: classProjects, error: projectsError } = await supabase
      .from('class_projects')
      .select(`
        project_id,
        projects!inner (
          id,
          code,
          title,
          description,
          due_at,
          is_active
        )
      `)
      .in('class_id', classIds)
      .eq('projects.is_active', true);

    if (projectsError) {
      return { success: false, error: `Projects fetch error: ${projectsError.message}` };
    }

    const projects = classProjects?.map(cp => cp.projects) || [];

    return {
      success: true,
      data: {
        classes,
        projects,
        count: {
          classes: classes.length,
          projects: projects.length
        }
      }
    };

  } catch (error) {
    return { 
      success: false, 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Cleanup test data for a user
 */
export async function cleanupTestData(userId: string) {
  try {
    // Get student ID
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!student) return;

    // Delete submissions
    await supabase
      .from('submissions')
      .delete()
      .eq('student_id', student.id);

    // Delete enrollments
    await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', student.id);

    console.log('✅ Test data cleaned up for user:', userId);
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}